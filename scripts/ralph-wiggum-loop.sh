#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/ralph-wiggum-loop.sh [--checklist <path>] [--max-retries <n>] [--dry-run]

Options:
  --checklist <path>   Markdown checklist path (default: docs/server-test-gaps.md)
  --max-retries <n>    Retries per TODO item when validation fails (default: 2)
  --dry-run            Print the prompt for the first TODO item and exit
  -h, --help           Show this help

Environment overrides:
  RALPH_MODEL      (default: gpt-5.3-codex)
  RALPH_EFFORT     (default: xhigh)
  RALPH_SANDBOX    (default: workspace-write)
  RALPH_APPROVAL   (default: never)
USAGE
}

CHECKLIST="docs/server-test-gaps.md"
MAX_RETRIES=2
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --checklist)
      [[ $# -ge 2 ]] || { echo "Missing value for --checklist" >&2; exit 2; }
      CHECKLIST="$2"
      shift 2
      ;;
    --max-retries)
      [[ $# -ge 2 ]] || { echo "Missing value for --max-retries" >&2; exit 2; }
      MAX_RETRIES="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if ! [[ "$MAX_RETRIES" =~ ^[0-9]+$ ]]; then
  echo "--max-retries must be a non-negative integer, got: $MAX_RETRIES" >&2
  exit 2
fi

MODEL="${RALPH_MODEL:-gpt-5.3-codex}"
EFFORT="${RALPH_EFFORT:-xhigh}"
SANDBOX="${RALPH_SANDBOX:-workspace-write}"
APPROVAL="${RALPH_APPROVAL:-never}"

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

if [[ ! -f "$CHECKLIST" ]]; then
  echo "Checklist not found: $CHECKLIST" >&2
  exit 1
fi

if ! rg -q '^## TODO$' "$CHECKLIST"; then
  echo "Checklist is missing a '## TODO' section: $CHECKLIST" >&2
  exit 1
fi

if ! rg -q '^## DONE$' "$CHECKLIST"; then
  echo "Checklist is missing a '## DONE' section: $CHECKLIST" >&2
  exit 1
fi

tmp_root="${TMPDIR:-/tmp}"
log_file="$tmp_root/ralph-wiggum.log"
resolved_count=0
rejected_count=0
iteration=0

count_todo_items() {
  awk '
    /^## TODO$/ { in_todo = 1; next }
    /^## DONE$/ { in_todo = 0 }
    in_todo && /^- \[ \] / { c++ }
    END { print c + 0 }
  ' "$CHECKLIST"
}

first_todo_line() {
  awk '
    /^## TODO$/ { in_todo = 1; next }
    /^## DONE$/ { in_todo = 0 }
    in_todo && /^- \[ \] / { print; exit }
  ' "$CHECKLIST"
}

todo_contains_line() {
  local needle="$1"
  awk -v needle="$needle" '
    /^## TODO$/ { in_todo = 1; next }
    /^## DONE$/ { in_todo = 0 }
    in_todo && $0 == needle { found = 1; exit }
    END { exit found ? 0 : 1 }
  ' "$CHECKLIST"
}

done_line_for_command() {
  local command="$1"
  awk -v command="$command" '
    /^## DONE$/ { in_done = 1; next }
    /^## / && in_done { in_done = 0 }
    in_done && $0 ~ /^- \[[xX]\] / && index($0, "`" command "`") {
      line = $0
    }
    END {
      if (line != "") print line
    }
  ' "$CHECKLIST"
}

build_prompt() {
  local todo_line="$1"
  local command="$2"
  local checklist_path="$3"

  cat <<EOF
Work in this repo and resolve exactly one checklist item in \`$checklist_path\`.

Target TODO line (resolve this one and only this one):
$todo_line

Required behavior:
1. Resolve only the target item in this run. Do not modify any other TODO/DONE entries.
2. If the target rationale indicates no server test is needed, do not add tests. Move it from TODO to DONE and mark as rejected.
3. If server test is needed, implement minimal server-facing coverage for \`$command\`, run focused tests, and move it from TODO to DONE.
4. Keep checklist headings and structure intact.
5. DONE line format must be exactly one of:
   - [x] \`$command\` — Implemented: <short note>
   - [x] \`$command\` — Rejected: <short reason>
6. If implementation fails after a reasonable attempt, use Rejected with a concrete short reason, then move item to DONE.
7. Do not ask for additional user input; act and finish.

When done, print:
- RESULT: Implemented|Rejected
- DONE_LINE: <exact line added to DONE>
- TESTS: <commands and results>
EOF
}

printf 'ralph-wiggum: checklist=%s model=%s effort=%s sandbox=%s approval=%s\n' \
  "$CHECKLIST" "$MODEL" "$EFFORT" "$SANDBOX" "$APPROVAL"
printf 'ralph-wiggum: logging failures to %s\n' "$log_file"

while true; do
  todo_line="$(first_todo_line)"
  if [[ -z "${todo_line:-}" ]]; then
    printf 'ralph-wiggum: no TODO items left, stopping.\n'
    break
  fi

  command_name="$(printf '%s\n' "$todo_line" | sed -n 's/.*`\([^`][^`]*\)`.*/\1/p')"
  if [[ -z "$command_name" ]]; then
    command_name="UNKNOWN_COMMAND"
  fi

  ((iteration += 1))
  printf '\nralph-wiggum: iteration=%d target=%s\n' "$iteration" "$command_name"

  attempt=0
  while true; do
    ((attempt += 1))
    todo_before="$(count_todo_items)"
    prompt_file="$(mktemp)"
    last_message_file="$(mktemp)"
    build_prompt "$todo_line" "$command_name" "$CHECKLIST" > "$prompt_file"

    if (( DRY_RUN )); then
      printf '%s\n' "--- DRY RUN: prompt for $command_name ---"
      cat "$prompt_file"
      rm -f "$prompt_file" "$last_message_file"
      exit 0
    fi

    set +e
    codex -a "$APPROVAL" exec \
      -m "$MODEL" \
      -c "model_reasoning_effort=\"$EFFORT\"" \
      -s "$SANDBOX" \
      -C "$repo_root" \
      --output-last-message "$last_message_file" \
      - < "$prompt_file"
    codex_exit=$?
    set -e

    rm -f "$prompt_file"

    todo_after="$(count_todo_items)"
    done_line="$(done_line_for_command "$command_name" || true)"
    still_in_todo=0
    if todo_contains_line "$todo_line"; then
      still_in_todo=1
    fi

    success=1
    reason="ok"

    if (( codex_exit != 0 )); then
      success=0
      reason="codex_exit=$codex_exit"
    elif (( todo_after != todo_before - 1 )); then
      success=0
      reason="todo_count_delta expected -1 got before=$todo_before after=$todo_after"
    elif (( still_in_todo == 1 )); then
      success=0
      reason="target line still present in TODO"
    elif [[ -z "${done_line:-}" ]]; then
      success=0
      reason="missing DONE line for command"
    elif [[ "$done_line" != *"— Implemented:"* && "$done_line" != *"— Rejected:"* ]]; then
      success=0
      reason="DONE line missing Implemented:/Rejected: marker"
    fi

    if (( success == 1 )); then
      if [[ "$done_line" == *"— Rejected:"* ]]; then
        ((rejected_count += 1))
      else
        ((resolved_count += 1))
      fi
      printf 'ralph-wiggum: success command=%s attempt=%d\n' "$command_name" "$attempt"
      printf 'ralph-wiggum: done_line=%s\n' "$done_line"
      rm -f "$last_message_file"
      break
    fi

    {
      printf '[%s] iteration=%d attempt=%d command=%s failure=%s\n' \
        "$(date +'%Y-%m-%d %H:%M:%S')" "$iteration" "$attempt" "$command_name" "$reason"
      if [[ -f "$last_message_file" ]]; then
        printf 'last_message:\n'
        sed -n '1,120p' "$last_message_file"
      fi
      printf '\n'
    } >> "$log_file"

    rm -f "$last_message_file"
    printf 'ralph-wiggum: validation failed for %s (attempt %d/%d): %s\n' \
      "$command_name" "$attempt" "$((MAX_RETRIES + 1))" "$reason"

    if (( attempt > MAX_RETRIES )); then
      printf 'ralph-wiggum: aborting after %d failed attempts for %s\n' "$attempt" "$command_name" >&2
      printf 'ralph-wiggum: see log: %s\n' "$log_file" >&2
      exit 1
    fi
  done
done

printf '\nralph-wiggum: completed. implemented=%d rejected=%d\n' "$resolved_count" "$rejected_count"
