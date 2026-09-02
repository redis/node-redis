# Multi-database client (automatic failover)

> :warning: The multi-db API is experimental and may change in a future release.

The multi-db client holds connections to several equivalent Redis databases — for example
Active-Active replicas in different regions — and routes all traffic to one *active* member.
When the active member fails, traffic switches to the healthiest remaining member
automatically. All members must be of the same kind: standalone clients, pools, clusters, or
sentinel deployments (one factory per kind).

```javascript
import { createMultiDbClient } from 'redis';

const { client, controller } = createMultiDbClient({
  databases: [
    { id: 'east', options: { url: 'redis://east.example.com:6379' }, weight: 1 },
    { id: 'west', options: { url: 'redis://west.example.com:6379' }, weight: 0.5 }
  ]
});

controller.on('failover', ({ from, to, reason }) => console.log(`failover ${from} -> ${to} (${reason})`));

await client.connect();
await client.set('key', 'value'); // served by 'east' until it fails
```

Every factory returns `{ client, controller }`:

- `client` is typed **exactly** as the corresponding base client (`RedisClientType`,
  `RedisClientPoolType`, `RedisClusterType`, `RedisSentinelType`) — a true drop-in. Command
  methods forward to the active member; `connect`/`close`/`destroy`/`quit` fan out across all
  members.
- `controller` carries everything multi-db-specific: inspection, weights, runtime add/remove,
  forced failover, and events. It is a separate object so `client`'s type stays identical to
  the base client.

Factories: `createMultiDbClient`, `createMultiDbClientPool`, `createMultiDbCluster`,
`createMultiDbSentinel` (from `@redis/client`; the `redis` package's `createMultiDbClient`
pre-registers the Stack modules like its `createClient`).

## How selection works

Each member carries a weight in `[0, 1]` (default 1) and a circuit breaker
(`CLOSED` → `OPEN` → `HALF_OPEN`). The active member is always the highest-weight member with
a `CLOSED` circuit; ties go to the earlier-configured member.

- **Failure detection.** Every forwarded command's outcome plus the active member's
  connection errors feed a sliding-window failure detector. It trips when, within
  `windowSize`, the failure count reaches `minNumOfFailures` **and** the failure rate reaches
  `failureRateThreshold` percent (setting either to `0` disables that condition). A trip
  opens the active member's circuit and fails over.
- **Background health checks.** Every member — active included — is probed on
  `healthCheck.interval` (default: PING). A failing active member fails over; a failing
  passive member is announced unhealthy. An `OPEN` circuit rests for `gracePeriod`, then
  recovery probes must pass `numProbes` consecutive times to close it again.
- **All members down.** Commands fail fast with `TemporarilyUnavailableError` while the
  client retries selection every `delayBetweenFailoverAttempts`, up to `maxFailoverAttempts`
  times. After that the client is permanently unavailable: commands fail with
  `PermanentlyUnavailableError` and background checking stops.
- **Fallback.** Off by default. With `autoFallbackInterval` set (or
  `controller.setAutoFallback(ms)`), the client periodically returns to a strictly
  higher-weight healthy member, emitting `fallback`.

## Configuration

`databases` is required; each entry is a `DatabaseConfig`:

| Field | Default | Meaning |
| --- | --- | --- |
| `options` | required | unchanged base client options for this member |
| `id` | `db-<position>` | stable identifier used in descriptors, events and controller calls |
| `weight` | `1` | selection weight in `[0, 1]` |
| `poolOptions` | — | pool factory only: per-member pool sizing |
| `skipInitialHealthCheck` | `false` | honored only via `controller.addDatabase` |

All other options are flat on the factory call:

| Option | Default | Meaning |
| --- | --- | --- |
| `gracePeriod` | `60000` | ms an `OPEN` circuit rests before recovery probing |
| `healthCheck.interval` | `5000` | ms between background check rounds per member |
| `healthCheck.timeout` | `3000` | ms per probe (must be < `interval`); bounds member connects too |
| `healthCheck.numProbes` | `3` | probes per round / consecutive successes to close a circuit |
| `healthCheck.delayBetweenProbes` | `500` | ms between probes within a round |
| `healthCheck.policy` | `'ALL'` | round aggregation: `ALL`, `MAJORITY` or `ANY` (early exit) |
| `healthChecks` | `[DefaultHealthCheck]` | custom check chain — every check must pass |
| `failureDetector` | thresholds below | custom `FailureDetector` instance, or thresholds for the default |
| `failureDetector.minNumOfFailures` | `1000` | failures within the window; `0` = rate-only |
| `failureDetector.failureRateThreshold` | `10` | failure rate (%); `0` = count-only |
| `failureDetector.windowSize` | `2000` | sliding window in ms |
| `failureDetector.errorFilter` | all count | which errors count as failures |
| `failoverStrategy` | `WeightBasedStrategy` | custom selection strategy |
| `maxFailoverAttempts` | `10` | selection retries before permanent unavailability |
| `delayBetweenFailoverAttempts` | `12000` | ms between selection retries |
| `autoFallbackInterval` | `-1` (off) | ms between fallback evaluations |
| `initialAvailability` | `'majority'` | members that must pass the initial check: `all`, `majority` or `one` |

`connect()` resolves only when `initialAvailability` is satisfied and an active member is
selected; otherwise it rejects **and destroys every member** — a rejected instance must not
be reused.

## Controller

```typescript
controller.getActiveDatabase(); // DatabaseDescriptor { id, weight, circuitState, role }
controller.getDatabases();      // all members, in config order

await controller.addDatabase({ id: 'south', options: { url: '...' }, weight: 0.6 });
await controller.removeDatabase('south'); // removing the active member switches first
controller.setWeight('west', 0.9);
controller.setAutoFallback(120_000);      // or false to disable

await controller.setActiveDatabase('west'); // forced failover: health-checked, then pinned
controller.releasePin();                    // resume automatic behavior
```

Forcing a member health-checks it first and rejects if the check fails. A verified-healthy
target's `OPEN` circuit is closed — the operator's knowledge overrides a stale state. While
pinned, auto-fallback is suspended; automatic failover still runs if the pinned member fails,
and clears the pin.

### Events

| Event | Payload | Fired when |
| --- | --- | --- |
| `failover` | `{ from, to, reason }` | the active member switched (`failure-detector`, `health-check`, `forced`, `active-removed`) |
| `fallback` | `{ from, to }` | auto-fallback returned to a higher-weight member |
| `database-unhealthy` | `{ id, cause }` | a member's circuit opened |
| `database-recovered` | `{ id }` | a member's circuit closed again |
| `all-databases-down` | `{ attempt, maxAttempts }` | one failed selection attempt with no healthy member |
| `error` | `Error` | a background task failed |

## Custom health checks and detectors

A health check probes one member through a narrow handle (`{ id, sendCommand }`); scheduling
and aggregation belong to the client. Checks chain: every check must pass.

```typescript
import { createMultiDbClient, LagAwareHealthCheck } from 'redis';

const { client, controller } = createMultiDbClient({
  databases: [/* ... */],
  healthChecks: [
    new LagAwareHealthCheck({
      restEndpoint: id => (id === 'east' ? 'https://east-cluster:9443' : 'https://west-cluster:9443'),
      bdbUid: 1,
      credentials: { username: 'admin', password: '...' },
      lagTolerance: 5000
    })
  ]
});
```

`LagAwareHealthCheck` targets the Redis Enterprise cluster REST API's availability endpoint
with lag verification: a member whose replication lag exceeds `lagTolerance` (default 5s)
reports unhealthy even while it still answers commands. It uses Node's built-in `fetch`; for
a custom CA, pass an undici dispatcher through `requestOptions` or use `NODE_EXTRA_CA_CERTS`.

A custom `FailureDetector` implements `onCommandResult(ok, err?)`, `isFaulty()` and
`reset()`; a custom `FailoverStrategy` implements `select(databases)` returning a member with
a `CLOSED` circuit, or `undefined` to escalate.

## Behavior contracts and caveats

- **In-flight commands are rejected on failure**, exactly like a single client's reconnect:
  commands awaiting a reply on the failing member reject with that member's error. Commands
  issued after the switch go to the new member (riding its offline queue if it is
  mid-reconnect). Unsent commands queued on the *old* member follow its own reconnect
  lifecycle — they are not migrated.
- **Eventual consistency.** Members are assumed to be asynchronously replicated. A switch
  offers no read-your-writes guarantee: a write acknowledged by the old member may not be
  visible on the new one.
- **Pub/sub.** On a switch between standalone members, subscriptions move to the new member
  and are removed from the old one (so its recovery cannot double-deliver). Messages
  published between the switch and the re-subscribe completing are lost. Cluster, sentinel
  and pool members do not transfer subscriptions across a switch yet.
- **Client-side caching** works per member and needs no flush on switch: each member client
  maintains its own tracked cache, so reads after a failover are served by the new member.
- **Resource overhead.** N member connections are live the whole time (each kind's usual
  connection count), plus one background health-check timer per member and the detector's
  sliding window on the command path. The command hot path adds one indirection per call.
- **Homogeneous members only.** One factory per topology; mixing kinds is not supported.
