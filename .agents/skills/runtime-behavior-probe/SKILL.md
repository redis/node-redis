---
name: runtime-behavior-probe
description: Plan and execute runtime-behavior investigations with temporary TypeScript probe scripts, validation matrices, state controls, and findings-first reports. Use only when the user explicitly invokes this skill to verify actual runtime behavior beyond normal code-level checks, especially to uncover edge cases, undocumented behavior, or common failure modes in local or live integrations. A baseline smoke check is fine as an entry point, but do not stop at happy-path confirmation.
---

# Runtime Behavior Probe

## Overview

Use this skill to investigate real runtime behavior, not to restate code or documentation. Start by planning the investigation, then execute a case matrix, record observed behavior, and report both the findings and the method used to obtain them.

## Core Rules

- Treat this skill as manual-only. Do not rely on implicit invocation.
- For `node-redis`, treat this skill as a disposable-probe workflow, not a repository implementation workflow.
- Unless the user explicitly asks for a reusable repository artifact, the allowed write scope is limited to:
  - a temporary directory used for probe scripts or artifacts
  - `.agents/skills/runtime-behavior-probe/**` when the user is editing this skill itself
- For disposable probes in `node-redis`, do not modify `examples/**`, `packages/**`, any `package.json`, `README.md`, workspace config, or build config.
- If your draft plan would touch a disallowed path, stop and rewrite the plan before editing anything.
- A baseline success or smoke case is often the right entry point, but do not stop there when the real question involves edge cases, drift, or failure behavior.
- Plan before running anything. Write the case matrix first, then fill it in with observed results. The matrix can live in a scratch note, a temporary file, or the probe script header.
- Default to local or read-only probes. Consider a live service only when it is clearly relevant, then apply the lightweight gates below before you run it.
- Size the probe to the decision. Start with the smallest matrix that can disqualify or validate the current hypothesis, then expand only when uncertainty remains.
- Before a live probe, apply three lightweight gates:
  - Destination gate. Use only a live destination that is clearly allowed for the task.
  - Intent gate. Run the live probe only when the user explicitly wants runtime verification on that integration, or explicitly approves it after you propose the probe.
  - Data gate. If the probe will read environment variables, mutate remote state, incur material cost, or exercise non-public or user data, name the exact variable names or data class and get explicit approval first.
- Classify each case as read-only, mutating, or costly before execution. For mutating or costly cases, or for any live case that will read environment variables, define cleanup or rollback before running the probe.
- Use temporary files or a temporary directory for one-off probe scripts.
- In `node-redis`, use disposable probe files outside git-tracked paths by default. Do not add one-off probes, harnesses, benchmarks, or examples under `examples/`, `packages/`, or other repository directories unless the user explicitly asks for a checked-in artifact.
- Keep temporary artifacts until the final response is drafted. Then delete them by default unless the user asked to keep them or they are needed for follow-up. Even when artifacts are deleted, keep a short run summary of the command shape, runtime context, and artifact status in the report.
- Before executing a live probe that will read environment variables, tell the user the exact variable names you plan to use and why, then wait for explicit approval. Examples include `REDIS_URL`, `REDIS_PASSWORD`, and other expected default names for the system under test.
- Never print secrets, even when they come from standard environment variables that this skill may use.
- For Redis command or server semantics, treat the repository source as the truth and use [redis.io/commands](https://redis.io/commands) to confirm contract-sensitive details such as argument order, reply types, and version availability. Use runtime probing to validate or challenge the documented behavior, not to skip the documentation pass entirely. If you rely on the website rather than source, say so in the report.
- For benchmark or comparison probes, make parity explicit before execution. Record what is held constant, what variable is under test, which reply-shape constraints keep the comparison fair, and any counters or timings that matter for interpreting latency or cost.
- In `node-redis`, default to a light local loop for probe authoring: temporary `probe.ts` plus temporary `tsconfig.json`, `npx tsc --noEmit -p <tmp-tsconfig>`, then `npx tsx <tmp-probe>`. Escalate to `npm run build` only when the runtime question is specifically about `dist/`, emitted exports, or packaged output.
- In `node-redis`, do not treat a request for runtime verification, benchmarking, or comparison as permission to add a reusable example, benchmark harness, package script, or checked-in sample. Those repository changes require explicit user intent.
- For probes that need a running Redis, remove setup ambiguity before attributing a negative result to client behavior:
  - Confirm the server is reachable and note its mode (standalone, cluster, or sentinel) and RESP version before interpreting reply shapes.
  - Treat RESP2 and RESP3 as separate cases, not interchangeable setup details, when the question is about reply type mapping or push messages.
  - Clear unsupported server-version or command options first so they do not invalidate the probe. The repo test harness `@redis/test-utils` can start Redis in Docker for local probes.

## Workflow

1. Restate the investigation target in operational terms. Name the runtime surface, the key uncertainty, and the highest-risk behaviors to test.
2. For `node-redis`, declare the allowed write scope before you do any implementation work. For a normal disposable probe, that means a temporary directory only.
3. Do a short preflight. Check the relevant code or docs first, decide whether the question needs local or live validation, and note any repo, baseline, or release boundary that matters.
4. Create a validation matrix before executing probes. Cover both baseline behavior and the most relevant failure or drift cases. The matrix can live in a scratch note, a temporary file, or a structured header inside the probe script.
5. For each case, choose an execution mode up front:
   - `single-shot` for deterministic one-run checks.
   - `repeat-N` for cache, retry, streaming, interruption, rate-limit, concurrency, or other run-to-run-sensitive behavior.
   - `warm-up + repeat-N` when first-run cold-start effects could distort the result. Use these defaults unless the task clearly needs something else:
   - Quick screen of a repeat-sensitive question: `repeat-3`.
   - Decision-grade latency or release recommendation: `warm-up + repeat-10`.
   - Costly live cases: start at `repeat-3`, then expand only if the answer remains unclear. If it is genuinely unclear whether extra runs are worth the time or cost, ask the user before expanding the probe.
6. When the question is benchmark-like or comparative, run in phases. Start with a high-signal pilot matrix against a control, then expand only the surviving candidates or unresolved cases.
7. If the question is about a suspected regression or behavior change, add at least one known-good control case such as `origin/master`, the latest release, or the same request without the suspected option.
8. For comparative probes, define parity before execution. Record prompt or input shape, tool-choice setup, model-settings parity, state reuse rules, and any response-shape constraint that keeps the comparison fair. If materially different output length could bias the result, record usage or token notes too.
9. If the question asks whether one option has the same intelligence or quality as another, decide whether the matrix supports only example-pattern parity or a broader quality claim. For broader claims, add at least one harder or more open-ended case. Otherwise say explicitly that the result is limited to the covered patterns.
10. Plan state controls before execution when hidden state could affect the result. Record whether each case uses fresh or reused state, how cache reuse or cache busting is handled, what unique IDs isolate repeated runs, and how cleanup is verified.
11. If any live case will read environment variables, list the exact variable names and purpose for each case, then ask the user for approval before execution. Keep the approval ask short and include destination, read-only versus mutating or costly risk, exact variable names, and cleanup or rollback if relevant.
12. Build task-specific probe scripts in a temporary location. Keep the script small, observable, and easy to discard.
13. If you are about to propose a checked-in script, example, benchmark, or workspace script for `node-redis`, stop and verify that the user explicitly asked for a reusable repository artifact. If not, keep the probe temporary.
14. In `node-redis`, make the runtime context explicit:

- Run TypeScript probes from the repository root with `npx tsx` when practical.
- For probe authoring, create both `probe.ts` and a sibling temporary `tsconfig.json` under `mktemp -d`, then run `npx tsc --noEmit -p <tmp-tsconfig>` before the first live execution.
- Record the current commit, working directory, Node executable, Node version, and the package or source path you imported.
- Avoid accidental imports from a different checkout or from `/tmp/node_modules`. If the probe needs repository code, import it from a repository-relative `file://` URL rooted at `process.cwd()`.
- Prefer current-branch `lib/` imports when the question is "what does this branch do now?" and prefer `dist/` imports only when the question is specifically about packaged output after a build.
- Do not run a repository-wide build just to typecheck a disposable probe. Reserve `npm run build` for `dist/` probes or when emitted output is itself part of the question.

15. Execute the matrix and capture evidence. Record request shape, setup, observation summary, unexpected or negative result, error details, timing, runtime context, approved environment-variable names, repeat counts, warm-up handling, variance when relevant, cleanup behavior, and for comparisons note what was held constant plus any response-shape or usage notes that affect interpretation.
16. Update the matrix with actual outcomes, not guesses.
17. Keep temporary artifacts until the final response is drafted. Then delete them unless the user asked to keep them or they are needed for follow-up. Benchmark and repeat-heavy probes often need follow-up, so keeping artifacts is normal when the result may be revisited. If deleted, retain and report a short run summary.
18. Report findings first, with unexpected or negative findings first. Then summarize how the validation was performed and which cases were covered.
19. If the probe isolates one clear defect, you may include a short implementation hypothesis or minimal repro direction. Do not expand into a larger next-step plan unless the user asked for it.

## Validation Matrix

Use a matrix that makes the news easy to scan. Start from the runtime question and the observation summary, not just from `expected` and `pass` or `fail`.

Use a matrix with at least these columns:

- `case_id`
- `scenario`
- `mode`
- `question`
- `setup`
- `observation_summary`
- `result_flag`
- `evidence`

Add these columns when they materially improve the investigation:

- `comparison_basis`
- `variable_under_test`
- `held_constant`
- `output_constraint`
- `status`
- `confidence`
- `state_setup`
- `repeats`
- `warm_up`
- `variance`
- `usage_note`
- `risk_profile`
- `env_vars`
- `approval`
- `control`

Treat `result_flag` as a fast scan field such as `unexpected`, `negative`, `expected`, or `blocked`. Use `status` only when there is a credible comparison basis, baseline, or documented contract to compare against.

Always consider whether the matrix should include these categories:

- Baseline success.
- Control or baseline comparison when a regression is suspected.
- Boundary input or parameter variation.
- Invalid or unsupported input.
- Missing or incorrect configuration.
- Transient external failure such as timeout, network interruption, or rate limiting.
- Retry, idempotence, or cleanup behavior.
- Concurrency or overlapping operations when shared state or ordering may matter.
- Open-ended quality or intelligence samples when the question is broader than pattern parity.

Open [validation-matrix.md](./references/validation-matrix.md) when you need a stronger prioritization model or a reusable case template.

## Temporary Probe Scripts

Write one-off scripts in a temporary file or temporary directory such as one created by `mktemp -d`. Keep the script outside the repository by default, even when it imports code from the repository.

For `node-redis`, a disposable runtime probe should stay disposable. Do not add a package script, modify workspace config, or create a checked-in benchmark or example unless the user explicitly asks for a reusable repository artifact.

For `node-redis`, the default authoring loop should be:

1. `tmpdir=$(mktemp -d)`
2. Write `probe.ts` and `tsconfig.json` into `$tmpdir`
3. From the repository root, run `npx tsc --noEmit -p "$tmpdir/tsconfig.json"`
4. If the quick typecheck passes, run `npx tsx "$tmpdir/probe.ts"`
5. Only run `npm run build` if the probe intentionally imports `dist/` or validates packaged output

Use a temporary `tsconfig.json` that extends the repository base settings but includes only the disposable probe, for example:

```json
{
  "extends": "/absolute/path/to/node-redis/tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["./probe.ts"]
}
```

If the probe needs repository code:

- Run it with the repository root as the working directory.
- Use `npx tsx /tmp/probe.ts` from the repository root when practical.
- Use `npx tsc --noEmit -p /tmp/probe-tsconfig.json` as the default quick typecheck step before executing the probe.
- Import repository modules with a `file://` URL built from `process.cwd()` and a repo-relative path. Do not assume bare workspace imports such as `@redis/client` will resolve from `/tmp`.
- Use `lib/` imports for current-branch behavior probes and `dist/` imports for packaged-output probes.

Design the probe to maximize observability:

- Print or log the exact scenario being exercised.
- Capture runtime context such as git SHA, working directory, Node executable and version, relevant package versions, model or deployment name, endpoint or base URL alias, and any retry or tool options that materially affect behavior.
- For live probes, record only the names of environment variables that were approved for use. Never print their values.
- Capture structured outputs when possible.
- Preserve raw error type, message, and status code.
- For repeat-sensitive cases, capture the attempt index, warm-up status, and any stable identifiers that help compare runs.
- For repeated or benchmark-style probes, write both raw results and a compact summary artifact when practical.
- Keep branching minimal so each script answers a narrow question.

Before deleting the temporary script or directory, keep a short run summary of the script path, command used, runtime context, and whether the evidence was kept or deleted.

Open [typescript_probe.ts](./templates/typescript_probe.ts) when you want a lightweight disposable TypeScript probe scaffold. Open [repo-import-patterns.md](./references/repo-import-patterns.md) when you need to load current-branch workspace code from a temporary script.

## Reporting

Report in this order:

1. Findings. Put unexpected or negative findings first. If there was no real news, say that explicitly.
2. Validation approach. Summarize the code used, the runtime surface exercised, the execution modes, and the case matrix coverage.
3. Case results. Include the matrix or a condensed version of it when the case count is large.
4. Artifact status and brief run summary. State whether temporary artifacts were deleted or kept, and provide kept paths or the retained summary.
5. Optional implementation note. Include this only when one clear defect was isolated and a short implementation direction would help.

For comparative probes, the report should also say what was held constant, what variable was under test, and whether the result supports only pattern parity or a broader quality claim.

Open [reporting-format.md](./references/reporting-format.md) for the recommended response template.

## Resources

- Open [validation-matrix.md](./references/validation-matrix.md) to design and prioritize the case matrix.
- Open [error-cases.md](./references/error-cases.md) to expand common failure scenarios.
- Open [redis-runtime-patterns.md](./references/redis-runtime-patterns.md) for recurring node-redis runtime probe patterns.
- Open [repo-import-patterns.md](./references/repo-import-patterns.md) for repository-relative TypeScript import guidance.
- Open [reporting-format.md](./references/reporting-format.md) for the final report structure.
- Open [typescript_probe.ts](./templates/typescript_probe.ts) for a minimal disposable TypeScript probe scaffold.
