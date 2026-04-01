#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/coverage-blitz.sh [--parallel <n>] [--dry-run] [--package <name>] [--filter <pattern>]

Iterates over every Redis command in every package and launches Augment CLI
agents in parallel to ensure test coverage for multiple response shapes.

Options:
  --parallel <n>      Max parallel agents (default: 20)
  --dry-run           Print the commands that would be run without executing
  --package <name>    Only process a specific package (e.g., "client", "search")
  --filter <pattern>  Only process commands matching this glob pattern (e.g., "ACL_*")
  -h, --help          Show this help

Environment overrides:
  BLITZ_MODEL       Augment model to use (default: not set, uses auggie default)
  BLITZ_MAX_TURNS   Max agentic turns per command (default: 30)
USAGE
}

PARALLEL=20
DRY_RUN=0
PACKAGE_FILTER=""
CMD_FILTER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --parallel)
      [[ $# -ge 2 ]] || { echo "Missing value for --parallel" >&2; exit 2; }
      PARALLEL="$2"; shift 2 ;;
    --dry-run)
      DRY_RUN=1; shift ;;
    --package)
      [[ $# -ge 2 ]] || { echo "Missing value for --package" >&2; exit 2; }
      PACKAGE_FILTER="$2"; shift 2 ;;
    --filter)
      [[ $# -ge 2 ]] || { echo "Missing value for --filter" >&2; exit 2; }
      CMD_FILTER="$2"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

MODEL="${BLITZ_MODEL:-}"
MAX_TURNS="${BLITZ_MAX_TURNS:-30}"

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

REDIS_DOCS_DIR="${REDIS_DOCS_DIR:-/Users/nikolay.karadzhov/Projects/docs/content/commands}"
if [[ ! -d "$REDIS_DOCS_DIR" ]]; then
  echo "coverage-blitz: Redis docs directory not found: $REDIS_DOCS_DIR" >&2
  echo "  Set REDIS_DOCS_DIR to the correct path." >&2
  exit 1
fi

log_dir="${TMPDIR:-/tmp}/coverage-blitz-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$log_dir"

# ── Discover commands ────────────────────────────────────────────────────
# Output format: package_name<TAB>command_basename
discover_commands() {
  for pkg_dir in packages/*/; do
    local pkg_name
    pkg_name="$(basename "$pkg_dir")"

    [[ -d "$pkg_dir/lib/commands" ]] || continue

    if [[ -n "$PACKAGE_FILTER" && "$pkg_name" != "$PACKAGE_FILTER" ]]; then
      continue
    fi

    find "$pkg_dir/lib/commands" -maxdepth 1 -name '*.ts' \
      ! -name '*.spec.ts' \
      ! -name 'index.ts' \
      ! -name 'generic-transformers.ts' \
      ! -name 'common-stream.types.ts' \
      ! -name 'helpers.ts' \
      -print0 \
    | while IFS= read -r -d '' impl_file; do
      local cmd_name
      cmd_name="$(basename "$impl_file" .ts)"

      if [[ -n "$CMD_FILTER" ]] && [[ "$cmd_name" != $CMD_FILTER ]]; then
        continue
      fi

      printf '%s\t%s\n' "$pkg_name" "$cmd_name"
    done
  done
}

# ── Build prompt ─────────────────────────────────────────────────────────
PROMPT_TEMPLATE_FILE="${PROMPT_TEMPLATE_FILE:-$repo_root/scripts/coverage-blitz-prompt.txt}"

build_prompt() {
  local pkg="$1"
  local cmd="$2"
  local impl_path="packages/$pkg/lib/commands/${cmd}.ts"
  local spec_path="packages/$pkg/lib/commands/${cmd}.spec.ts"
  # ACL_SETUSER -> acl-setuser.md
  local docs_filename
  docs_filename="$(printf '%s' "$cmd" | tr '[:upper:]' '[:lower:]' | tr '_' '-').md"
  local docs_path="$REDIS_DOCS_DIR/$docs_filename"

  sed \
    -e "s|{{PKG}}|$pkg|g" \
    -e "s|{{CMD}}|$cmd|g" \
    -e "s|{{IMPL_PATH}}|$impl_path|g" \
    -e "s|{{SPEC_PATH}}|$spec_path|g" \
    -e "s|{{DOCS_PATH}}|$docs_path|g" \
    "$PROMPT_TEMPLATE_FILE"
}

# ── Main ─────────────────────────────────────────────────────────────────
commands_file="$(mktemp)"
trap 'rm -f "$commands_file"' EXIT

discover_commands | sort -u > "$commands_file"

total=$(wc -l < "$commands_file" | tr -d ' ')
printf 'coverage-blitz: discovered %d commands across packages\n' "$total"
printf 'coverage-blitz: parallel=%d log_dir=%s\n' "$PARALLEL" "$log_dir"

if [[ "$total" -eq 0 ]]; then
  echo "coverage-blitz: no commands found. Check --package / --filter options." >&2
  exit 1
fi

if (( DRY_RUN )); then
  printf '\n--- DRY RUN: would launch %d agents ---\n\n' "$total"
  while IFS=$'\t' read -r pkg cmd; do
    model_flag=""
    [[ -n "$MODEL" ]] && model_flag="-m $MODEL"
    printf 'auggie --print --quiet --max-turns %s %s -w "%s" -i <prompt for %s/%s>\n' \
      "$MAX_TURNS" "$model_flag" "$repo_root" "$pkg" "$cmd"
  done < "$commands_file"
  printf '\n--- First prompt preview (%s/%s) ---\n' \
    "$(head -1 "$commands_file" | cut -f1)" "$(head -1 "$commands_file" | cut -f2)"
  first_pkg="$(head -1 "$commands_file" | cut -f1)"
  first_cmd="$(head -1 "$commands_file" | cut -f2)"
  build_prompt "$first_pkg" "$first_cmd"
  exit 0
fi

# ── Parallel execution ───────────────────────────────────────────────────
run_one() {
  local pkg="$1"
  local cmd="$2"
  local log_file="$log_dir/${pkg}__${cmd}.log"
  local prompt_file
  prompt_file="$(mktemp)"

  build_prompt "$pkg" "$cmd" > "$prompt_file"

  printf 'coverage-blitz: [START] %s/%s\n' "$pkg" "$cmd"

  auggie --print --quiet \
    --max-turns "$MAX_TURNS" \
    ${MODEL:+-m "$MODEL"} \
    -w "$repo_root" \
    --add-workspace "$REDIS_DOCS_DIR" \
    --permission "launch-process:allow" \
    --permission "str-replace-editor:allow" \
    --permission "save-file:allow" \
    --permission "view:allow" \
    --permission "codebase-retrieval:allow" \
    --permission "web-fetch:allow" \
    --permission "web-search:allow" \
    -if "$prompt_file" \
    > "$log_file" 2>&1
  local exit_code=$?

  rm -f "$prompt_file"

  if (( exit_code == 0 )); then
    printf 'coverage-blitz: [DONE]  %s/%s\n' "$pkg" "$cmd"
  else
    printf 'coverage-blitz: [FAIL]  %s/%s (exit=%d) — see %s\n' \
      "$pkg" "$cmd" "$exit_code" "$log_file" >&2
  fi

  return "$exit_code"
}
# Export for GNU parallel (which uses separate shells)
export -f run_one build_prompt 2>/dev/null || true
export MODEL MAX_TURNS repo_root log_dir PROMPT_TEMPLATE_FILE REDIS_DOCS_DIR

# ── Signal handling ───────────────────────────────────────────────────────
interrupted=0
cleanup() {
  (( interrupted )) && return
  interrupted=1
  printf '\ncoverage-blitz: interrupted, killing background jobs...\n' >&2
  jobs -p 2>/dev/null | xargs kill 2>/dev/null || true
  wait 2>/dev/null || true
  printf 'coverage-blitz: logs in %s\n' "$log_dir" >&2
  exit 130
}
trap cleanup INT TERM

# ── Run agents in parallel ───────────────────────────────────────────────
# Use slot files to track running jobs (robust across bash versions)
set +e

slot_dir="$(mktemp -d)"
failed=0

count_slots() {
  ls -1 "$slot_dir" 2>/dev/null | wc -l | tr -d ' '
}

fail_dir="$(mktemp -d)"

while IFS=$'\t' read -r pkg cmd; do
  # Wait for a slot to open
  while [ "$(count_slots)" -ge "$PARALLEL" ]; do
    sleep 0.5
  done

  (
    slot_file="$slot_dir/${pkg}__${cmd}"
    touch "$slot_file"
    trap 'rm -f "$slot_file"' EXIT
    run_one "$pkg" "$cmd" || touch "$fail_dir/${pkg}__${cmd}"
  ) </dev/null &
done < "$commands_file"

# Wait for all background jobs
wait 2>/dev/null

failed=$(ls -1 "$fail_dir" 2>/dev/null | wc -l | tr -d ' ')
rm -rf "$slot_dir" "$fail_dir"
set -e

printf '\ncoverage-blitz: finished. logs in %s\n' "$log_dir"
if (( failed != 0 )); then
  printf 'coverage-blitz: %d agent(s) failed — check logs for details\n' "$failed" >&2
  exit 1
fi
exit 0
