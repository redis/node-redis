# Maintainer Evaluation Framework

Use this reference when a claim is ambiguous, severity is disputed, or a technically correct PR may not justify permanent maintenance.

## Contents

- [Decision model](#decision-model)
- [Severity](#severity)
- [Evidence strength](#evidence-strength)
- [Unmet need and alternative design gate](#unmet-need-and-alternative-design-gate)
- [Issue disposition](#issue-disposition)
- [PR quality and value](#pr-quality-and-value)
- [Documentation threshold](#documentation-threshold)
- [Lifecycle and failure paths](#lifecycle-and-failure-paths)
- [Concurrency and cleanup ownership](#concurrency-and-cleanup-ownership)
- [Better-alternative prompts](#better-alternative-prompts)
- [Competing pull requests](#competing-pull-requests)
- [Maintainer comments](#maintainer-comments)
- [Compact report variants](#compact-report-variants)

## Decision Model

Treat validity, severity, and merge-worthiness as separate outputs. Also distinguish a `Preliminary assessment`, which may still require approved runtime evidence, from a final `Maintainer decision`. Do not label a provisional positive result as a verdict or final decision.

| Dimension | Question | Strong evidence |
| --- | --- | --- |
| Claim validity | Does the exact behavior occur, and is the proposed cause correct? | Reproduction, failing focused test, or complete reachable path |
| Reachability | Can supported realistic inputs reach it? | Public API trace, real configuration, user report, or release comparison |
| Consequence | What fails, and is it silent or recoverable? | Observed output/error/state and downstream effect |
| Breadth | Which packages, runtimes, providers, and versions are affected? | Explicit path and compatibility matrix |
| Frequency | Is it normal, intermittent, or pathological? | Repeats, deterministic preconditions, reports, or telemetry |
| Need evidence | Is the exact scope demonstrated, merely plausible, already covered, or unsupported? | Same-scope user scenario, real-path reproduction, released compatibility requirement, violated supported contract, repeated demand, or broad consequential invariant |
| Unmet need | What user outcome cannot be achieved through supported behavior today, or what supported contract is violated? | Concrete scenario plus a trace showing why the closest existing path is insufficient or defective |
| Existing capability | Can configuration, composition, cloning, callbacks, extension points, or a caller-owned layer already satisfy the outcome? | Current release code, tests, docs, and an exact supported workflow |
| Compatibility | Is released API, package resolution, protocol, or durable state changed? | Latest release comparison and contract inspection |
| Solution fit | Is the requested mechanism the best design and implementation layer? | Proposed solution compared with the strongest existing path and at least one narrower or more coherent alternative |
| Resource ownership | Can stale, failed, cancelled, or overlapping work mutate or clean up resources owned by surviving work? | Interleaving trace, attempt or generation ownership, and survivor assertions |
| Maintenance cost | What permanent complexity and review burden is added? | New branches/configuration, changed surface, tests, and remaining work |

## Severity

- **Negligible**: no runtime difference, unreachable/unsupported input, cosmetic inconsistency, or harmless edge case. Usually close, document, or decline code complexity.
- **Low**: real but narrow and recoverable behavior with a simple workaround and no data, security, or compatibility risk. Merge only when the fix is small and strengthens an invariant.
- **Moderate**: supported use fails or produces incorrect behavior for a meaningful subset. Prioritize a bounded fix and regression test.
- **High**: common or important use is broken, released compatibility is seriously affected, sensitive data can leak, or persistent corruption is possible. Require urgent strong validation.
- **Critical**: broadly exploitable security impact, severe data loss, or systemic failure requiring coordinated action. Use only with concrete evidence.

Severity is consequence multiplied by realistic reach and frequency, reduced by recoverability. Do not raise it because prose is alarming or lower it because a diff is small.

## Evidence Strength

Before calling a claim confirmed, answer:

- Does the reproduction exercise the same public/internal path?
- Does failure occur on the relevant base, latest release, or target?
- Does the regression test fail without the patch and pass with it?
- Are stale `dist`, wrong worktree/imports, dependency drift, proxies, caches, runtime conditions, unavailable Docker/sandbox, authentication, quota, and service failures excluded?
- Does an equivalent RESP2/RESP3, single-node/cluster, sentinel, pub/sub, or package-export path differ?
- Is behavior prohibited by a real contract or merely surprising?
- For latency, timeout, buffering, backpressure, or cleanup, was observable time or state measured rather than inferred only from mocks?
- For shared asynchronous state, do tests control completion order and prove that a stale failure or cleanup cannot affect the surviving operation?

Use `partially confirmed` when the symptom is real but cause/reach/scope is wrong. Use `unproven` when decisive evidence is missing. Use `contradicted` only when evidence directly disproves the claim.

## Unmet Need and Alternative Design Gate

Issue reports often combine a desired outcome with a proposed API or implementation. Treat the proposed mechanism as a hypothesis. Confirm the unmet outcome or violated supported contract before evaluating how well the patch implements that mechanism.

### Linked-evidence scope

Evidence from a linked issue applies only when the issue and PR share the same runtime variant, provider or tool type, trigger, supported configuration, and user outcome. A broad title, ordinary reference, `Related to` statement, or conceptual similarity is not enough. If an earlier change already resolved the concrete reported scenario, an adjacent extension starts with no inherited evidence of need.

### Need evidence status

Assign one status before deep implementation review:

- **Demonstrated**: The exact scope has a concrete supported scenario, real-path reproduction, released compatibility requirement, violated supported contract, repeated demand, or broad invariant with meaningful consequence.
- **Plausible but unproven**: The code path is possible, but realistic reach, frequency, consequence, provider behavior, or demand is missing.
- **Already covered**: A reasonable supported workflow already satisfies the outcome.
- **Unsupported**: The outcome is outside the client's public contract or belongs at a Redis-server, adapter, or caller-owned layer.

Only `Demonstrated` need can support a merge-worthy code recommendation. `Plausible but unproven` maps to `Needs evidence` or `Not worth completing`, even when the patch is technically correct and its remaining fixes are bounded. `Already covered` and `Unsupported` normally map to closure or a simpler non-core alternative.

Before accepting an issue or recommending a PR, record:

| Question | Required evidence |
| --- | --- |
| What outcome is needed? | A concrete supported scenario stated without the proposed API or fix |
| What exists today? | The closest current-release API, configuration, composition, extension point, or caller-owned solution |
| Why is it insufficient? | An exact behavioral, compatibility, lifecycle, or operational constraint, not preference alone |
| What are the alternatives? | The proposed patch, the strongest existing path, and at least one no-code, narrower, or better-layer design |
| Why add a contract? | Practical benefit sufficient to justify public surface, runtime branches, cross-path tests, documentation, and long-term maintenance |

Classify the result:

- **Capability gap**: a supported, realistic outcome cannot be achieved with current functionality. Code may be warranted.
- **Ergonomics or discoverability gap**: the outcome is already possible, but the supported route is confusing or unnecessarily difficult. Prefer documentation, validation, or a narrowly justified convenience improvement.
- **Unsupported use case**: the desired outcome lies outside the client's public contract or belongs at the Redis server, an adapter, application, or other caller-owned layer. Do not expand the core API merely to make it possible.
- **No demonstrated gap**: no concrete scenario proves that existing functionality is insufficient. Request evidence or close rather than designing from the proposed mechanism.
- **Defect in supported behavior**: the existing path violates a documented or established correctness, security, compatibility, or lifecycle contract. A workaround may affect priority or solution shape, but does not erase the defect.

Passing tests for a new implementation establish feasibility and correctness, not need. A `sinon` spy or stub, a fake socket, a `@redis/test-utils` fixture, a mock, or any synthetic fixture does not establish realistic server behavior, user reach, frequency, consequence, or demand. API symmetry and parity with an adjacent runtime are design arguments, not need evidence. A technically coherent patch can still be `Not worth completing` when the motivating scenario is hypothetical, already supported, or better solved elsewhere.

Use the counterfactual maintainer test: if the PR did not already exist, would maintainers choose to file and implement the same work from the available evidence? Contributor effort lowers implementation cost but does not create product need or remove permanent maintenance cost.

When the need is not `Demonstrated`, inspect implementation only far enough to estimate contract, risk, and maintenance cost. Do not convert patch defects, missing tests, or documentation gaps into a request-changes disposition; those become merge blockers only after the need gate passes.

## Issue Disposition

Choose one:

- **Prioritize**: confirmed moderate-or-higher impact or important invariant with no safe workaround.
- **Accept, low priority**: confirmed low impact, existing supported functionality is insufficient or defective for the demonstrated scenario, and a proportionate fix is plausible.
- **Narrow scope**: valid core, overstated paths or expected behavior.
- **Needs evidence**: plausible but missing a supported reproduction, contract basis, or concrete scenario showing why existing functionality is insufficient.
- **Close**: duplicate, unsupported, unreachable, contradicted, no-op, already addressed by a reasonable supported path, or not worth permanent complexity.

Ask only for evidence that could change the disposition.

## PR Quality and Value

Assess independently:

1. **Need**: same-scope evidence demonstrates a concrete unmet user outcome or defect in supported behavior, and the closest supported capability cannot reasonably satisfy the scenario as-is. Do not inherit evidence from an adjacent variant or already-fixed scenario.
2. **Correctness**: the fix covers the claim and meaningful boundaries.
3. **Placement**: the invariant is enforced once at the owning layer instead of duplicating existing functionality, patching locally, or moving caller- or server-owned policy into the core client.
4. **Consistency**: equivalent streaming/non-streaming, provider, runtime, serialization, resume, package, and adapter paths stay aligned.
5. **Tests**: a regression test fails on base, passes on head, and asserts the non-happy-path value/state. When shared state crosses an asynchronous boundary, tests control relevant completion orders and assert the surviving operation's behavior and final resource state.
6. **Compatibility**: released exports, package conditions, types, protocols, schemas, and error behavior are preserved or intentionally migrated.
7. **Proportionality**: public surface and complexity match impact.
8. **Completion cost**: remaining code, tests, docs, design, and conflict work is bounded enough to justify attention.

A PR can be correct but not merge-worthy because the need is negligible, the outcome is already supported through a reasonable existing mechanism, the real path is unchanged, equivalent paths remain inconsistent, the abstraction costs more than the benefit, or a simpler design exists at another layer.

Do not use implementation correctness, bounded remaining work, CI status, or contributor effort to upgrade a need that is only `Plausible but unproven`. Merge-worthiness is gated by demonstrated need, not by how close the patch is to completion.

Keep issue severity separate from `Patch risk`. A patch-induced regression, compatibility break, listener/resource leak, or maintenance hazard does not make the underlying issue more severe.

## Documentation Threshold

Make docs merge-blocking only when:

- Existing docs become materially false, unsafe, or misleading.
- Safe/correct use depends on a non-obvious constraint, migration, compatibility boundary, or operational warning.
- Repository policy, accepted scope, or an explicit maintainer decision requires docs in the same PR.
- The feature is practically unusable or undiscoverable without a user-facing entrypoint and generated/API discovery is insufficient.

Keep optional discoverability/completeness non-blocking. Do not downgrade a code recommendation solely for optional docs or include optional docs in a required-action paragraph.

## Lifecycle and Failure Paths

Apply this section when a change adds validation, fail-fast behavior, cleanup, retry, interruption, background work, streaming, or concurrency.

- Identify the earliest point where all dynamic inputs required for a correct decision exist.
- List side effects before and after that point: listeners, promises/tasks, streams, sockets, peer connections, processes, files, locks, caches, state, persistence, and telemetry.
- Exercise failure during construction, connection, validation, execution, persistence, and teardown where those phases exist.
- Confirm normal teardown is actually entered. If construction/connect fails, verify explicit cleanup.
- Prefer validation after dynamic configuration is resolved but before avoidable side effects begin.
- Require a regression test for any listener, promise, stream lock, connection, process, file, or state that can remain after failure.

## Concurrency and Cleanup Ownership

Apply this section before a positive assessment whenever lifecycle work crosses an `await`, callback, event, deferred completion, retry, reconnect, cancellation, or shared resource boundary. Sequential correctness is insufficient because the patch can improve isolated cleanup while introducing cross-attempt teardown.

Use a two-operation interleaving matrix during desk review:

| Ordering | Required question |
| --- | --- |
| `A pending -> B starts -> A fails -> B succeeds` | Can A's cleanup remove or revert anything B needs? |
| `A pending -> B starts -> B fails -> A succeeds` | Can B's cleanup leave A successful but non-functional? |
| `A succeeds -> B starts -> stale A completion` | Can stale A overwrite B's newer state or generation? |
| setup -> close/cancel -> late completion | Can late work resurrect listeners, state, tasks, or connections after teardown? |

For each ordering:

- Identify the resource owner before and after every suspension point.
- Distinguish per-attempt resources from shared transport, session, cache, or listener state.
- Require cleanup to carry an ownership token, generation, identity check, serialization guarantee, or another invariant that prevents cross-attempt disposal.
- Compare base and head on the survivor invariant. Fewer duplicates do not justify losing the only active handler, connection, task, or state update.
- Require a controlled interleaving test when the ordering is reachable. The test must assert both the failing operation and the surviving operation's observable behavior after all completions settle.

An unscoped `finally`, `catch`, close handler, cancellation callback, or rollback that mutates shared state after a suspension point is merge-blocking when another operation can still own or use that state.

## Better-Alternative Prompts

Start with the strongest existing supported path, then test at least one additional alternative against the proposed patch. Do not complete a positive review without this comparison.

- Can the requested outcome already be achieved through configuration, composition, cloning, callbacks, extension points, a custom provider or adapter, or caller-owned code?
- If the existing route is awkward, is the problem discoverability or ergonomics rather than missing capability?
- What happens with no code change?
- Can input validation or an existing helper enforce the invariant earlier?
- Can the fix be limited to the supported failing path?
- Would clearer error or documentation prevent misuse without runtime complexity?
- Can a failing test reveal a smaller correct change?
- Is a new public option compensating for an internal ownership problem?
- Can the same result be achieved in the converter, adapter, or state owner instead of every caller?
- Is the proposed core behavior actually provider- or application-specific policy that belongs at another layer?

## Competing Pull Requests

Require an explicit issue link, same reproduction, same violated invariant, or materially overlapping runtime path before grouping candidates.

| Criterion | Question |
| --- | --- |
| Need | Does a concrete user outcome remain unmet, or supported behavior remain defective, after tracing existing functionality? |
| Existing capability | Could every candidate be avoided by configuration, composition, an extension point, or a better caller- or provider-owned solution? |
| Coverage | Whole confirmed issue, useful subset, or adjacent problem? |
| Correctness | Real path and meaningful boundaries? |
| Placement | Owning shared layer? |
| Tests | Base failure reproduced and approaches distinguished? |
| Compatibility | Released APIs, packages, state, protocols, providers, runtimes? |
| Complexity | Permanent branches, abstractions, configuration, coupling? |
| Readiness | Mergeable now or bounded focused work? |
| Reuse | Exact tests or ideas worth transferring? |

Choose one portfolio action:

- **Prefer one PR**
- **Prefer one after focused changes**
- **Combine selectively** into a named destination PR
- **Replace all** with a simpler/coherent implementation
- **Merge none**

Do not issue independent approvals for overlapping candidates. State the action for every active PR.

## Maintainer Comments

Write drafts in English. Produce one when recommending closure, more evidence, focused changes, superseding, or choosing among competing PRs.

Keep it polite, direct, complete, and usually 60-160 words in one to three short paragraphs:

1. Acknowledge the contribution/report.
2. State the decision with decisive technical evidence.
3. Give the exact next action or reconsideration condition.

Do not include internal severity labels, speculate about authorship/intent, repeat the full review, or soften the requested action until it is unclear.

### Close

```text
Thanks for taking the time to investigate this. I traced the reported case through <path or behavior>, and <decisive finding>. In the supported path, <practical result>, so the added complexity is not justified by the demonstrated impact.

I am going to close this <issue/PR>. If you can provide <specific reproduction or evidence that would change the decision>, we can revisit the underlying problem with that narrower scope.
```

### Request Changes

```text
Thanks for the contribution. The underlying issue is valid, and this approach is directionally reasonable. Before we can merge it, please address the following points: <bounded required changes>.

These changes are needed because <contract, lifecycle, compatibility, or test reason>. Once they are covered with a regression test that fails on the base and passes on the updated branch, the PR should be ready for another review.
```

Adapt these templates to evidence. Do not use them as filler.

### Existing Capability or Better Alternative

```text
Thanks for the contribution. I traced the underlying use case through <existing API or workflow>, which already supports <desired outcome and relevant limits>. The proposed change adds <new contract or complexity>, but the issue does not demonstrate a concrete supported case that the existing approach cannot handle.

I am going to close this <issue/PR> for now. If you can provide <specific scenario showing the existing approach is insufficient>, we can revisit the unmet need and choose the narrowest appropriate design from that evidence.
```

## Compact Report Variants

Use `Maintainer decision` for a concluded review. Use `Preliminary assessment` when a desk review is tentatively positive but a decision-relevant runtime concern remains. `Verdict` is intentionally avoided in the report headings because it does not communicate whether the result is provisional or final.

### Runtime Approval Gate

```markdown
## Preliminary assessment

<Tentative issue or PR assessment based on desk review only.>

## Static evidence

- <decisive code-path or test-inspection evidence>
- <what remains uncertain at runtime>

## Proposed runtime probe

- Concern: <the uncertainty that could change the decision>
- Probe: <smallest exact execution path>
- Control: <base, release, or known-good comparison when relevant>
- Scope: <local-only or any live-service, cost, mutation, or cleanup implications>

## Approval request

<Ask whether to run this exact probe. Do not present a final positive recommendation yet.>
```

### Issue

```markdown
## Maintainer decision

<Real/partial/unproven/contradicted, severity, and disposition.>

## Evidence

- <decisive evidence>
- <scope or uncertainty>

## Existing capability and alternatives

<Closest supported path, why it is or is not sufficient, and the preferred design alternative.>

## Recommendation

<Prioritize, accept low priority, narrow, request evidence, or close.>

## Maintainer comment draft

<Include for closure or an evidence request.>
```

### Pull Request

```markdown
## Maintainer decision

<Need, practical impact, and merge-worthiness.>

- Need evidence: <Demonstrated / Plausible but unproven / Already covered / Unsupported>
- Code recommendation: <code disposition>
- Repository readiness: <one allowed status; only when useful for a merge-worthy recommendation>

## Evidence

- <runtime/code-path result>
- <test/compatibility result>

## Existing capability and alternatives

<Closest supported path, why the demonstrated scenario cannot use it or remains defective, and why this patch is preferable to no code change or a narrower design.>

## Issue impact

- Validity: <claim validity>
- Severity: <underlying issue severity>
- Reach: <realistic reach>

## Patch risk

<Only meaningful patch-induced risk.>

## PR quality

- Solution fit: <assessment>
- Tests: <assessment>
- Remaining effort: <bounded/unbounded and why>

## Recommendation

<Merge, focused changes, simpler replacement, or close.>

## Maintainer comment draft

<Only when closure, evidence, or changes should be requested.>
```

### Competing Pull Requests

```markdown
## Maintainer decision

<Issue validity, severity, and preferred implementation path.>

## Open PR comparison

| PR   | Approach | Correctness | Tests | Compatibility/complexity | Readiness |
| ---- | -------- | ----------- | ----- | ------------------------ | --------- |
| #... | ...      | ...         | ...   | ...                      | ...       |

## Recommendation

<Select one, request focused changes, combine exact pieces, replace all, or merge none.> <State the action for every other active candidate.>

## Maintainer comment drafts

<One draft for each PR that should be closed, changed, or superseded.>
```
