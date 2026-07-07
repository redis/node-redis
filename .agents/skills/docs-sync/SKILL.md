---
name: docs-sync
description: Analyze master branch implementation and configuration to find missing, incorrect, or outdated documentation in docs/, README.md, and per-package READMEs. Use when asked to audit doc coverage, sync docs with code, or propose doc updates/structure changes. Provide a report and ask for approval before editing docs.
---

# Docs Sync

## Overview

Identify doc coverage gaps and inaccuracies by comparing master branch features and configuration options against the current docs, then propose targeted improvements.

## Workflow

1. Confirm scope and base branch
   - Identify the current branch and default branch (`master`).
   - Prefer analyzing the current branch to keep work aligned with in-flight changes.
   - If the current branch is not `master`, analyze only the diff vs `master` to scope doc updates.
   - Avoid switching branches if it would disrupt local changes; use `git show master:<path>` or `git worktree add` when needed.

2. Build a feature inventory from the selected scope
   - If on `master`: inventory the full surface area and review docs comprehensively.
   - If not on `master`: inventory only changes vs `master` (feature additions/changes/removals).
   - Focus on user-facing behavior: public exports, client/cluster/sentinel/pool config options, new or changed commands, connection-string options, default values, and documented runtime behaviors.
   - Capture evidence for each item (file path + symbol/setting).
   - Use targeted search to find option types and feature flags (for example: `rg "Options"`, `rg "interface .*Options"`, `rg "export"` under `packages/*/lib`).
   - For Redis command behavior or server-side semantics, treat the source code (`parseCommand`/`transformReply` in `packages/*/lib/commands`) as the source of truth; consult [redis.io/commands](https://redis.io/commands) only to confirm server semantics when discrepancies appear.

3. Doc-first pass: review existing pages
   - Walk each relevant page under `docs/`, the top-level `README.md`, and each `packages/*/README.md`.
   - Identify missing mentions of important, supported options (opt-in flags, config), customization points, or new features from `packages/`.
   - Propose additions where users would reasonably expect to find them on that page.

4. Code-first pass: map features to docs
   - Review the current docs layout under `docs/` (e.g. `client-configuration.md`, `clustering.md`, `sentinel.md`, `pool.md`, `RESP.md`, `transactions.md`, `programmability.md`, `pub-sub.md`, `scan-iterators.md`, `command-options.md`).
   - Determine the best page/section for each feature based on existing patterns and package boundaries.
   - Identify features that lack any doc page or have a page but no corresponding content.
   - Note when a structural adjustment would improve discoverability.

5. Detect gaps and inaccuracies
   - **Missing**: features/configs present in master but absent in docs.
   - **Incorrect/outdated**: names, defaults, or behaviors that diverge from master.
   - **Structural issues** (optional): pages overloaded, missing overviews, or mis-grouped topics.

6. Produce a Docs Sync Report and ask for approval
   - Provide a clear report with evidence, suggested doc locations, and proposed edits.
   - Ask the user whether to proceed with doc updates.

7. If approved, apply changes
   - Edit docs under `docs/`, `README.md`, and the relevant `packages/*/README.md`.
   - Keep changes aligned with the existing docs style and navigation.
   - Place any runnable code snippets under `examples/` or `doctests/`, mirroring existing patterns.
   - Verify any snippet you add still compiles with `npm run build` and fix issues before handoff.

## Output format

Use this template when reporting findings:

Docs Sync Report

- Doc-first findings
  - Page + missing content → evidence + suggested insertion point
- Code-first gaps
  - Feature + evidence → suggested doc page/section (or missing page)
- Incorrect or outdated docs
  - Doc file + issue + correct info + evidence
- Structural suggestions (optional)
  - Proposed change + rationale
- Proposed edits
  - Doc file → concise change summary
- Questions for the user

## References

- `references/doc-coverage-checklist.md`
