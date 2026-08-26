---
name: maintainer-triage
description: Batch-triage and act on a set of node-redis PRs (or issues) by filter — fan out the maintainer-review methodology across them, present a one-word verdict plus a tldr to the user one at a time for approval, then execute the approved GitHub action (LGTM + merge, request-changes, close, or ask-for-evidence). Use when asked to triage/review recent PRs, PRs by an author/label/timeframe, or a set of issues, as a maintainer, and to carry the decision through to the actual GitHub action.
---

# Maintainer Triage

Batch maintainer triage for `redis/node-redis`. Given a filter, review each item with the
maintainer-review methodology, present concise verdicts for approval **one at a time**, then
execute the approved GitHub action.

This skill owns the **orchestration, interaction, and action execution**. It does NOT re-derive
how to review — the review methodology lives in the `maintainer-review` skill
(`.agents/skills/maintainer-review/SKILL.md` + `references/evaluation-framework.md`). Read those
for any actual review judgement.

## Prerequisites

- `gh` authenticated with `repo` scope (`gh auth status`).
- **Sandbox:** `gh` network calls fail with a TLS x509 error inside the sandbox. Run every `gh`
  command with the sandbox disabled.
- **Write permissions:** outward writes (`gh pr comment/review/merge/close`, `gh issue ...`,
  `gh run ...`, `gh api -X POST ...`) are gated by the auto-mode classifier and by settings
  allow-rules. You **cannot** self-grant these (editing settings to widen permissions is blocked).
  If a write is denied, stop and ask the user to either add allow-rules
  (`Bash(gh pr comment *)`, `Bash(gh pr review *)`, `Bash(gh pr merge *)`, `Bash(gh pr close *)`,
  `Bash(gh issue *)`, `Bash(gh run *)`, `Bash(gh api *)`) or run the command themselves via `!`.

## Step 1 — Gather candidates

Take a filter from the user: timeframe, author, label, or a search query.

```bash
gh pr list --repo redis/node-redis --state all --limit N \
  --json number,title,author,createdAt,state
# issues: gh issue list --repo redis/node-redis --search "..." --json number,title,author,state
```

- Always include `state`. **Drop anything already MERGED/CLOSED** — they need no action.
  (Lesson: items merge/close mid-session; don't waste a review on a done PR.)
- Show the candidate list (who / how many) and confirm the set before fanning out.

## Step 2 — Pre-fetch data (avoid N× network prompts in subagents)

Cache each item's metadata + diff to a temp dir so subagents read from disk, not the network:

```bash
gh pr view <n> --repo redis/node-redis \
  --json number,title,body,author,createdAt,state,files,additions,deletions,comments,reviews,labels,url \
  > "$DIR/<n>.json"
gh pr diff <n> --repo redis/node-redis > "$DIR/<n>.diff"
```

Gotchas learned the hard way:
- `closingIssuesReferences` is **not** a valid `--json` field — it errors the whole call.
- **zsh does not word-split unquoted variables** — iterate with an array: `PRS=(3427 3426 ...)`.
- `$TMPDIR` resolves differently inside vs outside the sandbox. Capture the real absolute path
  from a sandbox-disabled command and pass that absolute path to subagents.

## Step 3 — Fan out maintainer-review (desk review only)

One subagent per item. Each: reads the maintainer-review SKILL + evaluation-framework, reads the
cached `<n>.json` + `<n>.diff`, MAY read local repo source under `packages/*/lib` + specs + docs,
and MUST NOT run tests / Docker / network / any `gh` write.

Force structured output:
- `decision`: ONE WORD — `Merge` | `Revise` | `Supersede` | `Close` | `Evidence`
  - Merge = merge-worthy as-is · Revise = merge-worthy after focused changes ·
    Supersede = real need, simpler fix preferable · Close = not worth / already covered /
    unsupported · Evidence = need only plausible-but-unproven.
  - `Merge`/`Revise` are valid only when `needEvidence = Demonstrated`.
- `needEvidence`, `severity`, `short` (the tldr), `detailed` (full "Pull Request" compact report).

Mechanism:
- ≤ ~3 items → `Agent` tool in parallel.
- Many items → a `Workflow` (requires user opt-in). **Workflow gotcha:** the `args` param arrived
  as `undefined`/unusable — **inline the item list and paths as literals in the script**, don't
  rely on `args`.
- Collate into a single markdown file at repo root: summary table (sorted desc) on top, full
  per-item detailed reports below.

## Step 4 — Present one item at a time

Exact shape, then WAIT for the user before the next:

```
**PR #NNNN** — <title> (<author>)
**Problem (tldr):** 1–3 sentences.
**My verdict:** <one word> — <needEvidence>, <severity>[, <bounded ask if Revise>].
```

Go easiest-first unless told otherwise. The user approves, asks questions, or redirects. Only
disposition the current item before moving on.

## Step 5 — Comment style

- Friendly, plain, concise. **No jargon** (don't write "source-compatible pass-through"), and
  **don't restate the problem** for an LGTM. Baseline: `Thanks — this looks good to me. LGTM.`
- Declines / change-requests DO need a short plain-English reason (can't be one word) plus the
  exact next step or reopen condition.
- Draft → user approves the wording → then post. Post the approved wording **verbatim** (the
  classifier flags deviation from what was approved).

## Step 6 — Execute per verdict

- **Merge:** post LGTM comment → `gh pr review <n> --approve` → approve gated fork CI runs →
  wait for CI green → `gh pr merge <n> --squash`.
- **Revise:** post the change-request comment → **also submit the formal review**:
  `gh pr review <n> --request-changes --body "..."`. A plain comment does NOT flip the PR into
  "Changes requested" — the formal review does. Leave the PR open.
- **Close:** post a polite decline comment → `gh pr close <n>` (issues: `gh issue close <n>`).
- **Evidence:** post an evidence-request comment; leave open.

## CI handling (this repo's quirks)

- Outside-contributor **fork PRs** create **gated** Actions runs (`status=completed`,
  `conclusion=action_required`). Find and approve them:
  ```bash
  SHA=$(gh pr view <n> --repo redis/node-redis --json headRefOid -q .headRefOid)
  gh api "repos/redis/node-redis/actions/runs?head_sha=$SHA" \
    -q '.workflow_runs[]|select(.conclusion=="action_required" or .status=="waiting")|.id' \
    | while read -r id; do gh api -X POST "repos/redis/node-redis/actions/runs/$id/approve"; done
  ```
- **Auto-merge is disabled repo-wide AND the Actions CI is NOT a required check.** So
  `gh pr merge --auto` merges *immediately* (it does not wait for CI), and a plain merge lands
  regardless of CI. To honour "run CI, then merge" you must poll yourself and merge only on green.
  Use a background watcher: poll `gh api "repos/redis/node-redis/commits/$SHA/check-runs"` every
  ~30s; merge when `running==0 && failed==0 && total>=4`; **bail without merging on any failure**;
  stop the watcher if you end up merging directly. A green run is ~15 check-runs (Tests matrix +
  JSDoc + CodeQL + lint + Cursor Bugbot).

## Guardrails

- **Verify before asserting in a public comment.** Never repeat a subagent's unverified claim
  (e.g. "the cluster scan iterators have the same bug") — grep/read the real source first. The
  maintainer-review subagents will speculate; the user will catch a wrong claim.
- **Re-check each item's state right before acting** — it may have merged/closed since Step 1.
- **One outward action per explicit user approval.** Merge/close/request-changes are hard to
  reverse; confirm per item, don't batch-act without sign-off.
- Keep company-internal references out of comments, branches, and titles.
- **Final:** re-verify the state of every item and report the tally (merged / closed /
  changes-requested / evidence-requested).
