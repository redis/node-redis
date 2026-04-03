#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

all_tmp="$(mktemp)"
covered_tmp="$(mktemp)"
trap 'rm -f "$all_tmp" "$covered_tmp"' EXIT

rg --files packages \
  | rg '/lib/commands/[^/]+\.ts$' \
  | rg -v '\.spec\.ts$|/index\.ts$|generic-transformers\.ts$|common-stream\.types\.ts$|/helpers\.ts$' \
  | sed -E 's#^packages/([^/]+)/lib/commands/(.+)\.ts$#\1\t\2#' \
  | sed 's/[[:space:]]*$//' \
  | sort -u > "$all_tmp"

while IFS= read -r spec; do
  if rg -q "from ['\"]\\.\\./test-utils['\"]" "$spec" &&
    rg -q --pcre2 '(?m)^[\t ]*(?!//).*\.(?:testAll(?:InVersion)?|testWith(?:Client|Cluster|ClientPool|ClientSentinel|ClientIfVersionWithinRange|ProxiedClient|ProxiedCluster|RECluster))\(' "$spec"; then
    pkg="$(sed -E 's#^packages/([^/]+)/.*#\1#' <<< "$spec")"
    base="$(basename "$spec" .spec.ts | sed 's/[[:space:]]*$//')"
    printf '%s\t%s\n' "$pkg" "$base"
  fi
done < <(rg --files packages | rg '/lib/commands/[^/]+\.spec\.ts$') \
  | sort -u > "$covered_tmp"

if command -v column >/dev/null 2>&1; then
  comm -23 "$all_tmp" "$covered_tmp" | column -t -s $'\t'
else
  comm -23 "$all_tmp" "$covered_tmp"
fi
