---
name: maintainer-review
description: Review a GitHub issue or pull request URL as a node-redis maintainer, with a staged assessment of whether the claim is real, practically important, already solvable with supported functionality, correctly scoped, better served by another design, and worth maintainer and contributor effort. Use when assessing issue validity or severity, deciding whether an issue should be prioritized or closed, determining whether a requested feature represents an unmet need rather than a discoverability or usage gap, judging whether a PR is worth bringing to mergeable quality, comparing open PRs or alternative designs, separating code quality from repository readiness, or drafting a concise maintainer assessment. When closure, additional evidence, or code changes should be requested, also produce a polite, concise, complete, copy-paste-ready maintainer comment.
---

# Maintainer Review

## Objective

Make a maintainer decision, not a generic diff summary. Separate these questions:

1. Is the claimed behavior real?
2. What user outcome or constraint exists independently of the reporter's proposed API or fix?
3. Can supported functionality already achieve that outcome with reasonable composition or configuration?
4. If a gap remains, is the proposed solution the best design and implementation layer?
5. Can supported users plausibly reach the gap, and what happens when they do?
6. Is it important enough to act on now?
7. If this PR did not already exist, would maintainers choose to open and implement the same work?
8. For a PR, is this solution worth merging and maintaining?
9. Can overlapping or stale operations corrupt shared state or clean up resources owned by surviving work?
10. If competing PRs exist, which single implementation path should maintainers pursue?
11. What concise maintainer message should communicate closure, an evidence request, or required changes?

Treat an issue's requested field, callback, flag, class, or implementation strategy as a proposed mechanism, not as the accepted requirement. Do not begin by asking how to implement it. First establish either a concrete unmet user outcome or a violated supported contract, then prove that the proposed mechanism is better than the available alternatives.

Lead with the current review state. Use `Preliminary assessment` while runtime approval or evidence is pending, and `Maintainer decision` only when the review can be concluded. Use the diff, issue narrative, and contributor effort as evidence, not as proxies for impact.

## Workflow

### 1. Establish the exact remote target

- Accept a GitHub issue or PR URL as the primary input. Resolve owner, repository, item type, and number before reviewing it.
- For an issue, read the full report, comments, reproduction, environment, linked material, and maintainer responses.
- For a PR, inspect the current remote base and head, full patch, commit history when relevant, tests, linked issue, and review discussion. Do not substitute the current local checkout for the remote change.
- State the claim in one falsifiable sentence. Separate the observed symptom from the proposed cause or fix.
- Identify the latest released boundary when compatibility or regression claims matter.
- Verify whether linked evidence matches the PR's exact runtime variant, provider or tool type, triggering condition, and user outcome. A generic issue title, conceptual similarity, or wording such as `Related to` does not transfer evidence of need to an adjacent extension. If the reported scenario has already been fixed, treat additional variants as new needs requiring their own evidence.

Use read-only GitHub access. On this laptop, do not run `gh` unless the user explicitly asks in the same turn. A review never authorizes comments, labels, branch changes, pushes, merges, or other remote writes.

### 2. Establish the unmet need and challenge the proposed solution

Complete this pass before deeply evaluating a proposed implementation and before any positive issue or PR assessment.

First assign one `Need evidence` status:

- **Demonstrated**: The exact scope has a concrete supported scenario, a real-path reproduction, a released compatibility requirement, a violated supported contract, repeated demand, or a broad invariant with a meaningful consequence.
- **Plausible but unproven**: The path can exist, but realistic provider behavior, user reach, frequency, consequence, or demand is not established.
- **Already covered**: A reasonable supported workflow already satisfies the outcome.
- **Unsupported**: The outcome belongs outside the client's public contract or at a Redis-server, adapter, or caller-owned layer.

Only `Demonstrated` need may receive `Merge-worthy as-is` or `Merge-worthy after focused changes`. For `Plausible but unproven`, prefer `Needs evidence` or `Not worth completing`; for `Already covered` or `Unsupported`, prefer closure or the relevant simpler alternative.

1. Restate the desired user outcome without naming the requested API, class, file, option, or implementation. Separate the actual constraint from the reporter's preferred mechanism.
2. Trace the closest supported ways to achieve that outcome in the current release and current target. Inspect the owning code path, public API, tests, and relevant docs rather than assuming that an unfamiliar capability is missing. Consider configuration, composition, cloning, callbacks, extension points, provider adapters, and caller-owned code.
3. Determine whether the report shows a capability gap, an ergonomics or discoverability gap, an unsupported use case, or no demonstrated gap. A more convenient spelling is not automatically a missing capability.
4. Compare the proposed solution against the strongest existing approach and at least one better-design candidate: no code change, clearer documentation or validation, a narrower fix, reuse of an existing abstraction, or enforcement at a more coherent shared boundary.
5. For each viable approach, compare whether it satisfies the concrete scenario, what new public or internal contract it creates, cross-path consistency, compatibility, and permanent maintenance cost.

Do not treat a test proving that new code can work as evidence that the feature is needed. A `sinon` spy or stub, a fake socket, a synthetic fixture built with `@redis/test-utils`, or a new regression test can establish code-path reachability and implementation correctness; it does not by itself establish realistic server behavior, user reach, frequency, practical consequence, or demand.

API symmetry, naming consistency, and parity with an adjacent command, reply type, or output type are design arguments, not evidence of need. Parity may justify work when it removes existing complexity or enforces a broad demonstrated invariant, but adding branches, tests, documentation, or public behavior requires independent practical justification.

If the need is not `Demonstrated`, inspect the patch only far enough to understand its contract, risk, and maintenance cost. Do not turn implementation defects, missing tests, or documentation gaps into a request-changes recommendation, because those questions become merge-blocking only after the need gate passes. If the report provides no concrete scenario, the existing functionality appears sufficient, or the requested mechanism solves only a hypothetical convenience problem, prefer `Needs evidence`, `Close`, `Supersede with a simpler alternative`, or `Not worth completing` over designing the requested feature on the reporter's behalf.

An existing workaround may change priority or solution shape, but it does not by itself erase a demonstrated correctness, security, compatibility, or lifecycle defect in supported behavior. Evaluate both the unmet outcome and the violated contract.

### 3. Discover competing open PRs proportionally

Do this before deeply evaluating a specified PR. A PR URL selects the starting point, not necessarily the entire comparison set.

- Determine the primary issue from explicit closing keywords, linked issues, timeline/development links, PR body/comments, and the reproduced symptom. State when association is inferred.
- When an issue is explicitly linked, enumerate all open PRs that address it through cross-references, closing keywords, and development links. Include drafts but label them.
- When no issue is linked, run a bounded duplicate search using the strongest signals from the title, reproduction, violated invariant, and runtime path.
- Exclude closed/merged PRs from the active comparison set while using them as history when relevant.
- Require a shared issue, symptom, violated invariant, or materially overlapping path. A shared package label is not enough.
- If repository access cannot establish completeness, say so instead of claiming every candidate was found.

Compare candidates on need coverage, runtime correctness, placement, tests, compatibility, complexity, readiness, remaining maintainer work, and reusable pieces. Prefer the best maintainable solution, not the first or smallest diff by default.

### 4. Use a two-stage evidence flow

Always begin with a desk review. Inspect the real runtime path before judging a change as trivial or meaningful. Check callers, public exports, equivalent streaming/non-streaming or provider/runtime paths, persistence, cleanup, and focused tests. Inspecting test code is part of the desk review; executing tests, imports, examples, reproductions, benchmarks, or service calls is a runtime probe.

Consult `AGENTS.md` and the `docs/` guides (for example client-configuration, clustering, sentinel, pool, RESP, and transactions) for architecture and background, and treat the source under `packages/*/lib` as the source of truth. Verify every current claim against the remote change, current source, tests, docs, release boundary, and runtime evidence. Do not infer issue status or PR correctness from a guide.

Use this evidence order across the two stages:

1. Trace the closest existing supported capabilities and determine whether they already satisfy the underlying user outcome.
2. Inspect existing tests and complete the code-path trace, including the mandatory interleaving and ownership pass when triggered, without executing code.
3. With explicit user approval, run a focused local reproduction of the exact claim when the desk-review rules below require it.
4. A comparison with the latest release, base branch, or another known-good control.
5. A broader runtime matrix only when the maintainer decision remains uncertain and the user approves it.

#### Stage 1: desk review

Produce an initial result from static evidence before running code:

##### Mandatory unmet-need and design pass

Before a positive assessment, complete the pass in step 2 and be able to state all of the following from concrete evidence:

1. The user outcome that current supported behavior cannot achieve, or the supported contract that the reported defect violates.
2. The closest existing API or composition path and the exact reason it is insufficient.
3. Why the proposed behavior belongs at the chosen abstraction layer instead of a caller, provider, adapter, validation, documentation, or existing extension point.
4. Why the proposed permanent contract is better than no code change and the strongest narrower alternative.
5. What real scenario, compatibility requirement, violated invariant, or repeated demand justifies the maintenance surface.
6. Whether maintainers would choose to pursue the same work if no contributor had already supplied a patch.

If any answer is missing and could change whether code should exist at all, do not call the issue actionable or the PR merge-worthy. Request only the evidence needed to distinguish a genuine capability gap or contract violation from a usage, discoverability, or solution-design problem. This is a product and architecture evidence gap, not a runtime-probe trigger by itself.

##### Mandatory interleaving and ownership pass

Run this pass before any positive PR assessment when a patch adds, removes, or reorders cleanup, retry, reconnect, cancellation, listeners, shared promises or tasks, sockets or streams, state flags, or mutable state across an `await`, callback, event, or deferred completion.

1. Name each shared resource or state value and the operation that owns it. Include listeners, promises, tasks, connections, streams, locks, caches, state flags, persistence, and telemetry.
2. Trace at least two overlapping operations, `A` and `B`, across every suspension or re-entry point. Check `A pending -> B starts -> A fails -> B succeeds`, `A pending -> B starts -> B fails -> A succeeds`, close or cancellation between setup and completion, and a stale completion arriving after newer work.
3. For every cleanup or rollback, identify the exact attempt and resource generation it is allowed to dispose. Treat unconditional cleanup after a suspension point as a regression candidate until the code proves it cannot tear down newer or surviving work.
4. Compare base and head for the survivor invariant. Replacing duplicated work with missing handlers, a closed shared resource, reverted state, or a rejected surviving promise is a regression, not a successful cleanup.
5. Inspect tests for controlled interleavings using deferred promises, callbacks, or events. Require assertions about the surviving operation's observable behavior and final resource state, not only listener counts or individual rejection results.

Do not mark a concurrency-sensitive patch `Merge-worthy as-is` merely because sequential reconnect, retry, failure, and close tests pass. If the code trace proves an unsafe interleaving, conclude from static evidence and request a focused fix and regression test. If ownership remains ambiguous, keep the result preliminary and request approval for the smallest decisive runtime probe.

- If the claim or PR is decisively negative from a complete reachable code-path trace, conclude the review without a runtime probe. Examples include an impossible or unsupported path, duplicated existing handling, a demonstrated no-op, a direct compatibility break, or a clearly wrong abstraction. Do not call an ambiguous result negative merely to avoid a probe.
- If the initial result is positive and there is no unresolved runtime concern, and any triggered interleaving and ownership pass is complete, the desk review may be sufficient for a final maintainer decision. Do not run a probe only to restate evidence that cannot plausibly change the decision.
- If the initial result is positive but there is any unresolved runtime concern that could plausibly change claim validity, severity, merge-worthiness, required changes, or the preferred competing PR, stop before executing code. Report a `Preliminary assessment`, name the concern, propose the smallest decisive probe and control, and ask the user for approval to run it.
- A purely stylistic, documentation, CI-status, or repository-readiness concern does not trigger a runtime probe unless it masks a runtime question.

Do not issue a definitive positive maintainer decision while a decision-relevant runtime concern remains unresolved. If the user declines the probe, keep the result preliminary and state the exact confidence limitation.

#### Stage 2: approved runtime probe

After explicit approval, run only the smallest probe needed to resolve the stated concern. Exercise the real public or internal path and include a base, release, or known-good control when relevant. Do not stop at a happy-path smoke check when failure behavior determines the decision. Return to the user for separate approval before expanding materially beyond the approved probe.

For latency, timeout, buffering, backpressure, or cleanup, measure an observable elapsed-time or state transition where feasible. Do not assume that a mocked unit test exercises real scheduling or provider behavior. Prefer a local probe first; use an approval-gated live-service probe only when local evidence cannot settle the decision.

Use `$runtime-behavior-probe` only when the user explicitly invokes it or approves using it for the proposed runtime work. Preserve its environment-variable, live-service, cost, cleanup, and reporting gates. Ordinary maintainer review must not depend on that skill.

For validation, cleanup, retries, interruption, background work, or concurrency:

- Identify the earliest correct decision point after dynamic inputs are available.
- List resources acquired before and after it: listeners, promises/tasks, streams, connections, files, locks, caches, state mutations, and telemetry.
- Exercise failure during construction, connection, validation, execution, and cleanup where applicable.
- Verify explicit cleanup when failure occurs before normal teardown.
- Require a negative-path test when a listener, promise, stream, connection, process, or state can remain.

Stop when additional evidence is unlikely to change validity, severity, or maintainer action.

### 5. Calibrate validity and impact

Read [the evaluation framework](references/evaluation-framework.md) when validity, severity, or merge value is not immediately clear.

Assess claim validity, realistic reach, consequence, breadth, frequency, recoverability, compatibility, and severity. Keep observed facts separate from inference and name missing evidence that could change the result.

Report the `Need evidence` status before classifying the need as a capability gap, ergonomics or discoverability gap, unsupported use case, no demonstrated gap, or a defect in supported behavior. Do not assign practical impact to the absence of the requested mechanism when an existing supported workflow already produces the requested outcome. Do not infer practical importance merely from reachability, API asymmetry, or a technically successful patch.

For a PR, make `Severity` describe the underlying issue or user need. Report patch-induced regression, compatibility, lifecycle, or maintenance risk separately as `Patch risk`.

Do not speculate about AI authorship or contributor intent. Identify weak reports through objective evidence: no reproduction, unsupported input, impossible path, duplicated handling, a test that does not exercise the claim, or a fix that is a runtime no-op.

### 6. Apply the maintainer-effort test

Use one code recommendation:

- **Merge-worthy as-is**: real need, sound placement, proportionate scope, and adequate tests.
- **Merge-worthy after focused changes**: real need and viable direction with bounded corrections.
- **Supersede with a simpler alternative**: real need, but a smaller or more coherent fix is preferable.
- **Not worth completing**: negligible/unsupported impact, no-op behavior, wrong abstraction, or excessive completion cost.

`Merge-worthy as-is` and `Merge-worthy after focused changes` are invalid unless `Need evidence` is `Demonstrated`. A bounded set of implementation fixes cannot promote a `Plausible but unproven` need into a merge-worthy recommendation.

For merge-worthy recommendations, use one repository-readiness status when useful:

- **Ready**
- **CI or review pending**
- **Rebase or conflict resolution required**
- **Blocked**

Omit readiness for supersede/not-worth-completing recommendations; CI does not change those code decisions. Do not downgrade sound code only because CI is pending, and do not call a PR ready when semantic changes remain.

For competing PRs, make one portfolio recommendation: choose one, choose one after focused changes, combine exact pieces into one destination, replace all with a simpler approach, or merge none. State what should happen to every active candidate.

Always compare the proposed patch with the strongest existing supported approach and at least one alternative: no code change, validation or documentation, a narrower fix, reuse of an existing helper, or a different layer that enforces the invariant consistently. A review is incomplete if it establishes only that the patch works without establishing why the current product cannot meet the underlying need or violates a supported contract, and why this design is preferable.

### 7. Report the decision and action

Choose the assessment language from the current user request and governing repository instructions. Maintainer comment drafts remain English.

Use the matching compact report in the evaluation framework. While runtime approval is pending, use its preliminary-assessment variant and end with the approval request instead of presenting a final recommendation. Keep the report decision-oriented, put unexpected/negative evidence first, and use no more than five evidence bullets by default.

For PRs, put `Need evidence` before the code recommendation. When the need is not `Demonstrated`, lead with that result, omit repository readiness, and avoid presenting patch fixes as the primary maintainer action.

When existing functionality or a better alternative materially affects the decision, state it explicitly in the evidence and recommendation. Name the exact supported path, what it does and does not cover, and why it is preferable. Do not bury a `Not worth completing` or `Supersede with a simpler alternative` conclusion beneath praise for implementation quality.

When recommending closure, more evidence, focused changes, or superseding a PR, append a polite, complete, copy-paste-ready English maintainer comment. Include only merge-blocking work in its required-action paragraph. Do not produce a line-by-line review unless requested, equate passing tests with merge-worthiness, or equate a logically correct patch with practical value.

## Resource

- `references/evaluation-framework.md` contains the severity rubric, evidence checks, lifecycle review, issue dispositions, PR value checks, documentation threshold, competing-PR framework, maintainer-comment guidance, and compact report variants.
