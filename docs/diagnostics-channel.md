# Diagnostics Channel

Node Redis publishes telemetry through Node.js [`diagnostics_channel`](https://nodejs.org/api/diagnostics_channel.html), allowing APM tools and custom instrumentation to observe commands, connections, and internal events without modifying application code.

All channel name constants (`CHANNELS`) and payload types are exported from `@redis/client`.

```typescript
import { CHANNELS, type CommandTraceContext } from "@redis/client";
```

## Channel Types

### TracingChannels (async lifecycle)

Requires Node.js >= 18.19.0. These channels use Node.js `TracingChannel#tracePromise()` and emit `start`, `end`, `asyncStart`, `asyncEnd`, and `error` sub-events. `start`/`end` wrap the synchronous portion of the traced callback, while `asyncStart`/`asyncEnd` wrap the returned promise. Subscribe via `tracing:<name>:<event>`, for example `tracing:node-redis:command:start` or `tracing:node-redis:command:asyncEnd`.

```typescript
import dc from "node:diagnostics_channel";

// Fired when the command starts.
dc.subscribe("tracing:node-redis:command:start", ({ command, args }) => {
  console.log(`> ${command}`, args);
});

// Fired when the async Redis operation settles (success or failure).
dc.subscribe("tracing:node-redis:command:asyncEnd", ({ command }) => {
  console.log(`${command} settled`);
});

dc.subscribe("tracing:node-redis:command:error", ({ command, error }) => {
  console.error(`${command} failed:`, error);
});
```

| Channel name         | Payload                                          | Description                                |
| -------------------- | ------------------------------------------------ | ------------------------------------------ |
| `node-redis:command` | `CommandTraceContext / BatchCommandTraceContext`  | Individual command (standalone or pipeline) |
| `node-redis:batch`   | `BatchOperationContext`                           | MULTI/PIPELINE batch as a whole            |
| `node-redis:connect` | `ConnectTraceContext`                             | Socket connection attempt                  |

### Point-event channels (fire-and-forget)

Work on Node.js >= 16. Subscribe via `dc.subscribe('<name>', handler)`.

```typescript
dc.subscribe("node-redis:connection:ready", ({ clientId, createTimeMs }) => {
  console.log(`Client ${clientId} connected in ${createTimeMs.toFixed(1)}ms`);
});
```

| Channel name                            | Payload                         | Description                              |
| --------------------------------------- | ------------------------------- | ---------------------------------------- |
| `node-redis:connection:ready`           | `ConnectionReadyEvent`          | Socket connected and ready               |
| `node-redis:connection:closed`          | `ConnectionClosedEvent`         | Socket closed                            |
| `node-redis:connection:relaxed-timeout` | `ConnectionRelaxedTimeoutEvent` | Timeout relaxed/restored for maintenance |
| `node-redis:connection:handoff`         | `ConnectionHandoffEvent`        | Maintenance handoff completed            |
| `node-redis:error`                      | `ClientErrorEvent`              | Client or cluster error                  |
| `node-redis:maintenance`                | `MaintenanceNotificationEvent`  | Maintenance push notification            |
| `node-redis:pubsub`                     | `PubSubMessageEvent`            | Inbound PubSub message                   |
| `node-redis:cache:request`              | `CacheRequestEvent`             | Client-side cache hit/miss               |
| `node-redis:cache:eviction`             | `CacheEvictionEvent`            | Cache entry evicted                      |
| `node-redis:command:reply`              | `CommandReplyEvent`             | Command reply (for pubsub/streaming)     |
| `node-redis:pool:connection-wait`       | `PoolConnectionWaitEvent`       | Pool task acquired a client              |
