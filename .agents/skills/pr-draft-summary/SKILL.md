---
name: pr-draft-summary
description: Create the required PR-ready summary block, branch suggestion, title, and draft description for node-redis. Must be used before the final response whenever the actual task diff includes runtime code, tests, examples, build/test configuration, or docs with behavior impact, regardless of perceived change size. Skip only when no eligible files changed, every change is repo-meta or docs-only without behavior impact, the task is conversation-only, or the user explicitly opts out.
---

# PR Draft Summary

## Purpose

Produce a PR-ready summary after eligible work is complete: a concise change summary plus a PR-ready title and draft description for node-redis.

## Close-out Gate

1. Inspect the actual task diff before sending the final response.
2. Run this skill when the diff includes runtime code, tests, examples, build/test configuration, or docs with behavior impact. Do not use perceived change size to skip an eligible change.
3. Run it after any required verification and before sending the "work complete" response.
4. Skip only when no eligible files changed, every change is repo-meta or docs-only without behavior impact, the task is conversation-only, or the user explicitly opts out.

## Inputs to Collect Automatically (do not ask the user)

- Current branch: `git rev-parse --abbrev-ref HEAD`.
- Working tree: `git status -sb`.
- Untracked files: `git ls-files --others --exclude-standard` (use with `git status -sb`; `--stat` omits them).
- Changed files: `git diff --name-only` (unstaged) and `git diff --name-only --cached` (staged); sizes via `git diff --stat` and `git diff --stat --cached`.
- Pull request base reference (use `origin/master`; never use a feature branch's upstream as the PR base):
  - `BASE_REF=origin/master`; if it does not exist locally, use `master`.
  - `BASE_COMMIT=$(git merge-base "$BASE_REF" HEAD)`.
- Committed branch diff: `git diff --name-only "${BASE_COMMIT}..HEAD"` and `git diff --stat "${BASE_COMMIT}..HEAD"`.
- Commits ahead of the base fork point: `git log --oneline --no-merges ${BASE_COMMIT}..HEAD`.
- Category signals for this repo: runtime (`packages/*/lib`, `examples/`, `doctests/`, `benchmark/`, `scripts/`), tests (co-located `packages/**/*.spec.ts`), docs (`docs/`, `README.md`, `packages/*/README.md`, `AGENTS.md`, `.github/`), build/test config (`package.json`, `package-lock.json`, `tsconfig*.json`, `eslint.config.mjs`, `.mocharc*`, `mocha-multi-reporter-config.json`, `.nycrc*`).

## Workflow

1. Run the commands above without asking the user; compute `BASE_REF`/`BASE_COMMIT` first so later commands reuse them. Compare against `origin/master` or `master`, not the current branch's upstream.
2. Combine the committed branch diff with staged, unstaged, and untracked changes. If the combined diff is empty, reply briefly that no code changes were detected and skip emitting the PR block.
3. Infer change type from the touched paths listed under "Category signals"; classify as feature, fix, refactor, or docs-with-impact, and flag backward-compatibility risk only when the diff changes released public APIs, client/command behavior, connection config, or the RESP wire handling. Judge that risk against the latest release tag, not unreleased branch-only churn.
4. Summarize changes in 1–3 short sentences using the top five paths and stats from the committed, staged, and unstaged diffs. Explicitly call out untracked files because `--stat` does not include them. Use commit messages as supporting context, not as a substitute for inspecting the committed diff.
5. Choose the lead verb for the description: feature → `adds`, bug fix → `fixes`, refactor/perf → `improves` or `updates`, docs-only → `updates`.
6. Suggest a branch name. If already off `master`, keep it; otherwise propose `feat/<slug>`, `fix/<slug>`, or `docs/<slug>` based on the primary area (for example `docs/pr-draft-summary-guidance`).
7. If the current branch matches `issue-<number>` (digits only), keep that branch suggestion. When an issue number is present, reference `https://github.com/redis/node-redis/issues/<number>` and include an auto-closing line such as `This pull request resolves #<number>.` Do not block if the issue cannot be fetched.
8. Draft the PR title and description using the template below. Use Conventional Commits prefixes for the title (`feat:`, `fix:`, `docs:`, `chore:`, etc.).
9. Output only the block in "Output Format". Keep any surrounding status note minimal and in English. Do not include company-internal references (e.g. Jira/Confluence IDs) in the branch name, title, or description.

## Output Format

When closing out a task, add this concise Markdown block (English only) after any brief status note unless the task falls under the documented skip cases or the user says they do not want it.

```
# Pull Request Draft

## Branch name suggestion

git checkout -b <kebab-case suggestion, e.g., feat/pr-draft-summary-skill>

## Title

<single-line imperative title, which can be a commit message; a Conventional Commits prefix such as feat:, fix:, or docs: is preferred>

## Description

<include what you changed plus a draft pull request title and description for your local changes; start the description with prose such as "This pull request resolves/updates/adds ..." using a verb that matches the change (you can use bullets later), explain the change background (for bugs, clearly describe the bug, symptoms, or repro; for features, what is needed and why), any behavior changes or considerations to be aware of, and you do not need to mention any tests you ran.>
```

Keep it tight—no redundant prose around the block, and avoid repeating details between `Changes` and the description. Tests do not need to be listed unless specifically requested.
