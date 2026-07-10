# Redis Runtime Patterns

Use this reference for recurring node-redis investigations so you do not have to rediscover the probe strategy each time. Treat the repository source as the truth for client behavior, and use [redis.io/commands](https://redis.io/commands) to confirm contract-sensitive details such as argument order, reply types, and version availability. If you rely on the website rather than source, say so in the report.

## General Rules

- Prefer small, focused probes over large harnesses. Keep one script focused on one uncertainty.
- For comparative or benchmark-like questions, start with a pilot and expand only when the answer is still unclear.
- Capture both the request shape (command and arguments as sent) and the raw reply, before any client-side type mapping.
- Preserve raw error type, message, and any Redis error prefix such as `WRONGTYPE`, `MOVED`, `ASK`, `CROSSSLOT`, `NOSCRIPT`, or `LOADING`.
- Record whether behavior differs between the first call and a repeated call, and across a reconnect.
- When the question is about regression or contract drift, add a known-good control run before attributing the result to the change under investigation.
- Keep comparison parity explicit. Record what was held constant, what variable changed, and whether reply-shape or encoding differences could bias the conclusion.
- Record the runtime context that actually changes Redis client behavior: server mode (standalone, cluster, sentinel), RESP version (2 vs 3), server version, and whether a feature such as client-side caching or sharded pub/sub is in use.

## Connection Environment Variables

Do not read these variables automatically. Before a live probe uses any of them, tell the user the exact variable names you plan to read and why each one is needed, then wait for explicit approval. Never print their values:

- `REDIS_URL`
- `REDIS_PASSWORD`
- `REDIS_TLS_CA`, `REDIS_TLS_CERT`, `REDIS_TLS_KEY` (and any other `REDIS_TLS_*` the probe needs)

For most local probes you do not need any of these. The repository test harness `@redis/test-utils` can start Redis in Docker, so a disposable probe can target a local containerized server (for example `redis://localhost:6379`) without reading credentials. Prefer that over a live remote service unless the question is specifically about the remote deployment.

If the task targets another integration, use that integration's expected default variable names under the same rule.

## Environment False Signals

Before attributing a failure to the patch or client code under review, exclude source-selection and environment problems with a controlled comparison.

- Confirm the commit, worktree, working directory, Node executable/version, and imported module path. A probe of stale `dist`, another checkout, `/tmp/node_modules`, or an installed `redis` package does not prove current `lib` behavior.
- Rebuild when emitted declarations, package exports, generated metadata, or `dist` is the subject. Otherwise prefer current-source `lib/` imports so stale build output cannot create a false result.
- Confirm a Redis server is actually running and reachable. A connection refused or timeout against a missing Docker/Redis container is an environment condition, not a client defect, until a controlled rerun against a known-good server ties it to the code.
- Confirm the RESP version the client negotiated. A reply-shape surprise is often just RESP2 vs RESP3, not a bug.
- Confirm server mode matches the probe assumptions. Running a cluster-only expectation against a standalone server, or the reverse, produces misleading routing and slot errors.
- Run base and head controls with the same Node version, dependency graph, server mode, RESP version, environment-variable names, and command shape. Record intentional differences.
- Treat sandbox denials, unavailable Docker infrastructure, expired remote sessions, authentication, quota, rate limits, service outages, and stale caches as environment conditions until a controlled rerun ties them to the patch.
- Never print credentials, connection URLs with embedded passwords, or TLS key material. Change only the minimum in-scope environment or disposable state needed for the control and record variable names rather than values.

In the final report, distinguish code failures, unsupported configurations, environment blockers, and inconclusive probes. Do not collapse them into one failed-test count.

## Node-Redis Probe Patterns

Start from the uncertainty instead of from the full client surface. The patterns below cover the runtime questions that recur most often in node-redis.

### RESP2 vs RESP3 reply shapes and type mapping

Use when the uncertainty is what a command returns at runtime and how the client maps it.

- Run the same command under RESP2 and RESP3 as separate cases. Maps, sets, doubles, big numbers, verbatim strings, and booleans differ between the two protocols.
- Capture the raw reply and the post-mapping JavaScript value. Note whether the client returns plain objects, `Map`, arrays, `null`, or typed numbers.
- Watch precision-sensitive types. RESP3 `DOUBLE` and `BIG_NUMBER` can lose precision when mapped to `Number`; record the exact value.
- If the probe configures a custom `typeMapping`, treat each mapping choice as part of `held_constant`.

### Single-node vs cluster vs sentinel

Use when key routing, slot ownership, or topology matters.

- For cluster, capture which node served the command and whether a `MOVED` or `ASK` redirect occurred. Probe multi-key commands across keys in different slots to observe `CROSSSLOT` behavior and any client-side slot checks.
- Use hash tags (`{tag}`) to force keys into the same slot when the probe needs a multi-key command to succeed.
- For sentinel, capture master discovery and what happens on a simulated failover.
- Keep mode constant within a case. A standalone control alongside a cluster case is a useful comparison, not a substitute.

### Pub/sub and sharded pub/sub

Use when delivery semantics or resubscription matter.

- Capture subscribe confirmation, message delivery order, and whether messages are delivered to pattern (`PSUBSCRIBE`) and channel subscribers as expected.
- For sharded pub/sub (`SSUBSCRIBE` and `SPUBLISH`) in cluster, capture which shard delivered the message.
- Force a reconnect and observe whether the client resubscribes to channels and patterns automatically. This is a common drift point.

### Reconnection, retry, and the offline command queue

Use when the question is about resilience.

- Simulate a dropped connection (stop or restart the container, or close the socket) and capture: whether commands issued while offline are queued, the order they flush in on reconnect, and whether the reconnect strategy backoff behaves as configured.
- Distinguish commands rejected immediately from commands queued and later resolved or rejected.
- Capture whether in-flight commands at disconnect are retried, rejected, or hang.

### Pipelining and MULTI/EXEC transactions

Use when batching or atomicity is under test.

- For pipelining, confirm replies map back to the right commands in order, including when one command in the batch errors.
- For `MULTI`/`EXEC`, capture queueing errors versus execution errors, behavior on `DISCARD`, and `WATCH` optimistic-locking aborts (`EXEC` returning `null`).

### Client-side caching (RESP3 push invalidation)

Use when caching correctness matters.

- Requires RESP3. Capture whether invalidation push messages arrive after a tracked key is modified by another client, and whether the local cache entry is dropped.
- Probe the broadcast and default tracking modes separately.

### Blocking commands and connection isolation

Use for `BLPOP`, `BRPOP`, `XREAD BLOCK`, `WAIT`, and similar.

- Capture whether the blocking command monopolizes a connection and whether the client isolates it (for example via a dedicated connection) so other commands are not stalled.
- Probe timeout behavior and what resolves when the block is satisfied by another client versus when it times out.

### Pool behavior

Use when a pooled client is involved.

- Capture how commands are distributed across pool connections, behavior under saturation, and what happens when a pooled connection drops.
- For commands that require connection affinity (transactions, blocking, subscriptions), confirm the pool keeps them on a single connection.

### SCAN iterators

Use for `SCAN`, `HSCAN`, `SSCAN`, and `ZSCAN`.

- Capture cursor progression, whether the async iterator terminates, and whether `COUNT` and `MATCH` behave as expected. Note that SCAN gives no count or completeness guarantees mid-iteration.

### Large payloads and timeouts

Use when size or latency is the concern.

- Capture behavior with large values and large reply sets, and whether command-level or socket timeouts fire as configured.
- For repeat-sensitive latency, use warm-up plus repeat-N and record medians, not a single sample.

## What to Capture

For node-redis probes, try to record:

- The command and arguments as sent, plus the raw reply before type mapping.
- The mapped JavaScript value and its type, especially for RESP3 maps, sets, doubles, and big numbers.
- Server mode (standalone, cluster, or sentinel), negotiated RESP version, and server version.
- Whether fields are absent, `null`, empty, or transformed by the client.
- Raw error type, message, and any Redis error prefix for failures.
- Reconnect and retry behavior, offline-queue flush order, and resubscription on reconnect when relevant.
- For cluster, which node served the command and any redirect.
- Which environment-variable names were approved for the probe when a live or credentialed server was required.

Do not spend time rediscovering static documentation unless the runtime result seems to contradict what you expected. The value of this skill is in the observed behavior.
