--
name: test-coverage-improver
description: 'Improve test coverage in the node-redis monorepo: run a package test suite under nyc, inspect coverage artifacts, identify low-coverage files and branches, propose high-impact tests, and confirm with the user before writing tests.'
---

# Test Coverage Improver

## Overview

Use this skill whenever coverage needs assessment or improvement (coverage regressions, failing thresholds, or user requests for stronger tests). It runs the coverage suite, analyzes results, highlights the biggest gaps, and prepares test additions while confirming with the user before changing code.

Coverage is collected per package via `nyc` (each package's `test` script runs `nyc -r text-summary -r lcov mocha ...`). **Docker must be running** — the test harness starts real Redis containers via `@redis/test-utils`.

## Quick Start

1. Pick the target package (e.g. `@redis/client`) and run its tests under coverage from the repo root: `npm test -w @redis/client`. This regenerates that package's `coverage/`.
2. Collect artifacts: the `text-summary` printed to stdout for totals, plus `packages/<pkg>/coverage/lcov.info` and `packages/<pkg>/coverage/lcov-report/index.html` for line/branch drill-downs. For machine-readable file totals, rerun with an added summary reporter: `npm test -w @redis/client -- ... ` is awkward, so prefer `npx nyc -r json-summary -r text-summary mocha ...` from inside the package when you need `coverage/coverage-summary.json`.
3. Summarize coverage: total percentages, lowest files, branches under 80%, and uncovered lines/paths.
4. Draft test ideas per file: scenario, behavior under test, expected outcome, and likely coverage gain.
5. Ask the user for approval to implement the proposed tests; pause until they agree.
6. After approval, write the tests next to the source in the relevant package, rerun coverage, then run `npm run build` and `npm run lint` before marking work complete.

## Workflow Details

- **Run coverage**: Execute the target package's test script (`npm test -w <pkg>`) from the repo root. Avoid watch flags. Keep prior coverage artifacts only if comparing trends. Confirm Docker is available first.
- **Parse summaries efficiently**:
  - Use the printed `text-summary` for quick totals.
  - Use `coverage/lcov.info` or `coverage/lcov-report/index.html` to spot branch- and line-level holes.
  - Add the `json-summary` nyc reporter when you need `coverage/coverage-summary.json` for file-level totals.
- **Prioritize targets**:
  - Core client/cluster/sentinel/pool/RESP code in `packages/*/lib` before examples or docs.
  - Files with statements/branches below 80% or newly added code at 0%.
  - Recent bug fixes or risky code paths (error handling, reconnection, timeouts, pub/sub, concurrency).
- **Design impactful tests**:
  - Hit uncovered branches: error cases, boundary inputs, optional flags, and cancellation/timeouts.
  - Cover combinational logic rather than trivial happy paths.
  - Co-locate specs next to source as `packages/<pkg>/lib/**/<NAME>.spec.ts` (mocha + `tsx`, `node:assert`). For command/topology tests use `testUtils.testAll(name, fn, { client, cluster })`. Avoid flaky async timing.
- **Coordinate with the user**: Present a numbered, concise list of proposed test additions and expected coverage gains. Ask explicitly before editing code or fixtures.
- **After implementation**: Rerun coverage, report the updated summary, and note any remaining low-coverage areas.

## Notes

- Keep any added comments or code in English.
- Do not create `scripts/`, `references/`, or `assets/` unless needed later.
- If coverage artifacts are missing or stale, rerun the package test suite instead of guessing.
- `nyc` excludes `dist`, `**/*.spec.ts`, `lib/test-utils.ts`, and `examples/*` (see each package's `.nycrc`); do not target those for coverage.
