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

RESP_DIFF_FILE="${RESP_DIFF_FILE:-$repo_root/resp-diff.txt}"
if [[ ! -f "$RESP_DIFF_FILE" ]]; then
  echo "coverage-blitz: resp-diff.txt not found: $RESP_DIFF_FILE" >&2
  exit 1
fi

log_dir="${TMPDIR:-/tmp}/coverage-blitz-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$log_dir"

# ── Map Redis command name to package + file path ────────────────────────
# Input: Redis command name (e.g., "BF.ADD", "ACL GETUSER", "HGETALL")
# Output: sets PKG_NAME, IMPL_PATH, SPEC_PATH, CMD_BASENAME
resolve_command() {
  local redis_cmd="$1"
  local prefix=""
  local subcommand=""

  # For dotted commands (BF.ADD, FT.CURSOR READ), split on the first dot
  # For space-only commands (ACL GETUSER, CONFIG GET), split on the first space
  if [[ "$redis_cmd" == *"."* ]]; then
    prefix="${redis_cmd%%.*}"
    subcommand="${redis_cmd#*.}"
  elif [[ "$redis_cmd" == *" "* ]]; then
    prefix="${redis_cmd%% *}"
    subcommand="${redis_cmd#* }"
  else
    prefix="$redis_cmd"
  fi

  # Map prefix to package and subdirectory
  local pkg=""
  local subdir=""
  case "$prefix" in
    BF)      pkg="bloom"; subdir="bloom" ;;
    CF)      pkg="bloom"; subdir="cuckoo" ;;
    CMS)     pkg="bloom"; subdir="count-min-sketch" ;;
    TDIGEST) pkg="bloom"; subdir="t-digest" ;;
    TOPK)    pkg="bloom"; subdir="top-k" ;;
    FT)      pkg="search"; subdir="" ;;
    TS)      pkg="time-series"; subdir="" ;;
    JSON)    pkg="json"; subdir="" ;;
    *)       pkg="client"; subdir="" ;;
  esac

  # Build the file basename
  local file_basename
  if [[ -n "$subdir" ]]; then
    # For bloom subpackages: BF.ADD -> ADD, CF.INSERTNX -> INSERTNX
    file_basename="$(printf '%s' "$subcommand" | tr ' ' '_')"
  elif [[ "$redis_cmd" == *"."* ]]; then
    # For dotted non-bloom: FT.SEARCH -> SEARCH, FT.CURSOR READ -> CURSOR_READ
    file_basename="$(printf '%s' "$subcommand" | tr ' ' '_')"
  else
    # For client commands: ACL GETUSER -> ACL_GETUSER, HGETALL -> HGETALL
    file_basename="$(printf '%s' "$redis_cmd" | tr ' ' '_')"
  fi

  # Build paths
  if [[ -n "$subdir" ]]; then
    IMPL_PATH="packages/$pkg/lib/commands/$subdir/${file_basename}.ts"
    SPEC_PATH="packages/$pkg/lib/commands/$subdir/${file_basename}.spec.ts"
  else
    IMPL_PATH="packages/$pkg/lib/commands/${file_basename}.ts"
    SPEC_PATH="packages/$pkg/lib/commands/${file_basename}.spec.ts"
  fi

  PKG_NAME="$pkg"
  CMD_BASENAME="$file_basename"

  # Verify the implementation file exists
  if [[ ! -f "$IMPL_PATH" ]]; then
    return 1
  fi
  return 0
}

# ── Parse resp-diff.txt ──────────────────────────────────────────────────
# Output format: redis_cmd<TAB>resp2_line<TAB>resp3_line
# Each entry in resp-diff.txt is: command name, RESP2: line, RESP3: line, blank line
parse_resp_diff() {
  local cmd="" resp2="" resp3=""
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ -z "$line" ]]; then
      # End of entry — emit if we have all parts
      if [[ -n "$cmd" && -n "$resp2" && -n "$resp3" ]]; then
        printf '%s\t%s\t%s\n' "$cmd" "$resp2" "$resp3"
      fi
      cmd=""; resp2=""; resp3=""
    elif [[ "$line" == RESP2:* ]]; then
      resp2="$line"
    elif [[ "$line" == RESP3:* ]]; then
      resp3="$line"
    elif [[ -z "$cmd" ]]; then
      cmd="$line"
    fi
  done < "$RESP_DIFF_FILE"
  # Emit last entry if file doesn't end with blank line
  if [[ -n "$cmd" && -n "$resp2" && -n "$resp3" ]]; then
    printf '%s\t%s\t%s\n' "$cmd" "$resp2" "$resp3"
  fi
}

# ── Build prompt ─────────────────────────────────────────────────────────
PROMPT_TEMPLATE_FILE="${PROMPT_TEMPLATE_FILE:-$repo_root/scripts/coverage-blitz-prompt.txt}"

build_prompt() {
  local pkg="$1"
  local cmd_basename="$2"
  local impl_path="$3"
  local spec_path="$4"
  local resp_diff="$5"
  local resp_diff_summary="$6"

  # Write the resp_diff to a temp file for safe substitution
  local diff_file
  diff_file="$(mktemp)"
  printf '%s\n' "$resp_diff" > "$diff_file"

  # Use sed for simple placeholders, then handle RESP_DIFF separately
  sed \
    -e "s|{{PKG}}|$pkg|g" \
    -e "s|{{CMD}}|$cmd_basename|g" \
    -e "s|{{IMPL_PATH}}|$impl_path|g" \
    -e "s|{{SPEC_PATH}}|$spec_path|g" \
    -e "s|{{RESP_DIFF_SUMMARY}}|$resp_diff_summary|g" \
    "$PROMPT_TEMPLATE_FILE" \
  | sed -e "/{{RESP_DIFF}}/{
    r $diff_file
    d
  }"

  rm -f "$diff_file"
}

# ── Main ─────────────────────────────────────────────────────────────────
commands_file="$(mktemp)"
trap 'rm -f "$commands_file"' EXIT

# Parse resp-diff.txt into tab-separated entries
parse_resp_diff > "$commands_file"

# Apply filters
if [[ -n "$PACKAGE_FILTER" || -n "$CMD_FILTER" ]]; then
  filtered_file="$(mktemp)"
  while IFS=$'\t' read -r redis_cmd resp2 resp3; do
    if ! resolve_command "$redis_cmd"; then
      continue
    fi
    if [[ -n "$PACKAGE_FILTER" && "$PKG_NAME" != "$PACKAGE_FILTER" ]]; then
      continue
    fi
    if [[ -n "$CMD_FILTER" ]] && [[ "$CMD_BASENAME" != $CMD_FILTER ]]; then
      continue
    fi
    printf '%s\t%s\t%s\n' "$redis_cmd" "$resp2" "$resp3"
  done < "$commands_file" > "$filtered_file"
  mv "$filtered_file" "$commands_file"
fi

total=$(wc -l < "$commands_file" | tr -d ' ')
printf 'coverage-blitz: found %d commands in resp-diff.txt\n' "$total"
printf 'coverage-blitz: parallel=%d log_dir=%s\n' "$PARALLEL" "$log_dir"

if [[ "$total" -eq 0 ]]; then
  echo "coverage-blitz: no commands found. Check --package / --filter options." >&2
  exit 1
fi

if (( DRY_RUN )); then
  printf '\n--- DRY RUN: would launch %d agents ---\n\n' "$total"
  while IFS=$'\t' read -r redis_cmd resp2 resp3; do
    if ! resolve_command "$redis_cmd"; then
      printf 'SKIP (no impl file): %s\n' "$redis_cmd"
      continue
    fi
    model_flag=""
    [[ -n "$MODEL" ]] && model_flag="-m $MODEL"
    printf 'auggie %s -- %s/%s (%s)\n' "$model_flag" "$PKG_NAME" "$CMD_BASENAME" "$IMPL_PATH"
  done < "$commands_file"

  # Show first prompt preview
  first_redis_cmd="$(head -1 "$commands_file" | cut -f1)"
  first_resp2="$(head -1 "$commands_file" | cut -f2)"
  first_resp3="$(head -1 "$commands_file" | cut -f3)"
  if resolve_command "$first_redis_cmd"; then
    local_diff="$(printf '%s\n%s\n%s' "$first_redis_cmd" "$first_resp2" "$first_resp3")"
    printf '\n--- First prompt preview (%s/%s) ---\n' "$PKG_NAME" "$CMD_BASENAME"
    build_prompt "$PKG_NAME" "$CMD_BASENAME" "$IMPL_PATH" "$SPEC_PATH" "$local_diff" "$first_redis_cmd"
  fi
  exit 0
fi

# ── Parallel execution ───────────────────────────────────────────────────
run_one() {
  local redis_cmd="$1"
  local resp2="$2"
  local resp3="$3"

  if ! resolve_command "$redis_cmd"; then
    printf 'coverage-blitz: [SKIP]  %s (no implementation file found)\n' "$redis_cmd"
    return 0
  fi

  local log_file="$log_dir/${PKG_NAME}__${CMD_BASENAME}.log"
  local prompt_file
  prompt_file="$(mktemp)"

  local resp_diff
  resp_diff="$(printf '%s\n%s\n%s' "$redis_cmd" "$resp2" "$resp3")"

  build_prompt "$PKG_NAME" "$CMD_BASENAME" "$IMPL_PATH" "$SPEC_PATH" "$resp_diff" "$redis_cmd" > "$prompt_file"

  printf 'coverage-blitz: [START] %s/%s (%s)\n' "$PKG_NAME" "$CMD_BASENAME" "$redis_cmd"

  auggie --print --quiet \
    --max-turns "$MAX_TURNS" \
    ${MODEL:+-m "$MODEL"} \
    -w "$repo_root" \
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
    printf 'coverage-blitz: [DONE]  %s/%s\n' "$PKG_NAME" "$CMD_BASENAME"
  else
    printf 'coverage-blitz: [FAIL]  %s/%s (exit=%d) — see %s\n' \
      "$PKG_NAME" "$CMD_BASENAME" "$exit_code" "$log_file" >&2
  fi

  return "$exit_code"
}
# Export for GNU parallel (which uses separate shells)
export -f run_one build_prompt resolve_command parse_resp_diff 2>/dev/null || true
export MODEL MAX_TURNS repo_root log_dir PROMPT_TEMPLATE_FILE RESP_DIFF_FILE
export PKG_NAME IMPL_PATH SPEC_PATH CMD_BASENAME 2>/dev/null || true

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

while IFS=$'\t' read -r redis_cmd resp2 resp3; do
  # Wait for a slot to open
  while [ "$(count_slots)" -ge "$PARALLEL" ]; do
    sleep 0.5
  done

  (
    slot_file="$slot_dir/$(printf '%s' "$redis_cmd" | tr ' .' '_')"
    touch "$slot_file"
    trap 'rm -f "$slot_file"' EXIT
    run_one "$redis_cmd" "$resp2" "$resp3" || touch "$fail_dir/$(printf '%s' "$redis_cmd" | tr ' .' '_')"
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
