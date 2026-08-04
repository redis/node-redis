# Redis Sentinel

The [Redis Sentinel](https://redis.io/docs/management/sentinel/) object of node-redis provides a high level object that provides access to a high availability redis installation managed by Redis Sentinel to provide enumeration of master and replica nodes belonging to an installation as well as reconfigure itself on demand for failover and topology changes.

## Basic Example

```javascript
import { createSentinel } from 'redis';

const sentinel = await createSentinel({
    name: 'sentinel-db',
    sentinelRootNodes: [{
      host: 'example',
      port: 1234
    }]
  })
  .on('error', err => console.error('Redis Sentinel Error', err))
  .connect();

await sentinel.set('key', 'value');
const value = await sentinel.get('key');
await sentinel.close();
```

In the above example, we configure the sentinel object to fetch the configuration for the database Redis Sentinel is monitoring as "sentinel-db" with one of the sentinels being located at `example:1234`, then using it like a regular Redis client.

## Node Address Map

A mapping between the addresses returned by sentinel and the addresses the client should connect to.
Useful when the sentinel nodes are running on a different network to the client.

```javascript
import { createSentinel } from 'redis';

// Use either a static mapping:
const sentinel = await createSentinel({
  name: 'sentinel-db',
  sentinelRootNodes: [{
    host: 'example',
    port: 1234
  }],
  nodeAddressMap: {
    '10.0.0.1:6379': {
      host: 'external-host.io',
      port: 6379
    },
    '10.0.0.2:6379': {
      host: 'external-host.io',
      port: 6380
    }
  }
}).connect();

// or create the mapping dynamically, as a function:
const sentinel = await createSentinel({
  name: 'sentinel-db',
  sentinelRootNodes: [{
    host: 'example',
    port: 1234
  }],
  nodeAddressMap(address) {
    const [host, port] = address.split(':');

    return {
      host: `external-${host}.io`,
      port: Number(port)
    };
  }
}).connect();
```

## `createSentinel` configuration

| Property                   | Default   | Description                                                                                                                                                                                                                                                                                                           |
|----------------------------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| name                       |           | The sentinel identifier for a particular database cluster                                                                                                                                                                                                                                                             |
| sentinelRootNodes          |           | An array of root nodes that are part of the sentinel cluster, which will be used to get the topology. Each element in the array is a client configuration object. There is no need to specify every node in the cluster: 3 should be enough to reliably connect and obtain the sentinel configuration from the server. These nodes are treated as seeds and are always kept as reconnection candidates — see [Reconnecting after an outage](#reconnecting-after-an-outage). |
| maxCommandRediscovers      | `16`      | The maximum number of times a command will retry due to topology changes.                                                                                                                                                                                                                                             |
| nodeClientOptions          |           | The configuration values for every node in the cluster. Use this for example when specifying an ACL user to connect with                                                                                                                                                                                              |
| sentinelClientOptions      |           | The configuration values for every sentinel in the cluster. Use this for example when specifying an ACL user to connect with                                                                                                                                                                                          |
| masterPoolSize             | `1`       | The number of clients connected to the master node                                                                                                                                                                                                                                                                    |
| replicaPoolSize            | `0`       | The number of clients connected to each replica node. When greater than 0, the client will distribute the load by executing read-only commands (such as `GET`, `GEOSEARCH`, etc.) across all the cluster nodes.                                                                                                       |
| nodeAddressMap             |           | Defines the [node address mapping](#node-address-map)                                                                                                                                                                                                                                                                |
| scanInterval               | `10000`   | Interval in milliseconds to periodically scan for changes in the sentinel topology. The client will query the sentinel for changes at this interval.                                                                                                                                                                 |
| passthroughClientErrorEvents | `false` | When `true`, error events from client instances inside the sentinel will be propagated to the sentinel instance. This allows handling all client errors through a single error handler on the sentinel instance.                                                                                                     |
| reserveClient              | `false`   | When `true`, one client will be reserved for the sentinel object. When `false`, the sentinel object will wait for the first available client from the pool.                                                                                                                                                           |

## Reconnecting after an outage

As the client learns the sentinel topology it discovers additional sentinel nodes (reported by the sentinels as IP addresses). The nodes you pass in `sentinelRootNodes` are kept as **seeds**: they are always retained as reconnection candidates and are tried first, alongside the discovered nodes. This matters after an outage where the whole sentinel set restarts.

Whether the client can recover depends on what the seeds resolve to:

- **Hostname seeds** (e.g. a DNS name or a Kubernetes service) re-resolve on every reconnect attempt, so the client follows the sentinels to their new addresses even if every IP changed. This is the most robust configuration and is recommended for environments with ephemeral addressing (Kubernetes, cloud autoscaling, DHCP).
- **IP-literal seeds** recover only if the sentinels come back at the same addresses (static IP / bare-metal / fixed-IP container setups). If every sentinel restarts on a new IP and the seeds are IP literals, the client has no resolvable address left to reconnect to — there is no information from which to discover the new addresses. Use hostnames to avoid this.

A stale seed that never comes back is harmless: the client fails to connect to it and moves on to the next candidate.

## PubSub

It supports PubSub via the normal mechanisms, including migrating the listeners if the node they are connected to goes down.

```javascript
await sentinel.subscribe('channel', message => {
  // ...
});
await sentinel.unsubscribe('channel');
```

see [the PubSub guide](./pub-sub.md) for more details.

## Sentinel as a pool

The sentinel object provides the ability to manage a pool of clients for the master node:

```javascript
createSentinel({
  // ...
  masterPoolSize: 10
});
```

In addition, it also provides the ability have a pool of clients connected to the replica nodes, and to direct all read-only commands to them:

```javascript
createSentinel({
  // ...
  replicaPoolSize: 10
});
```

## Client Config

Many of the [Client Configs](docs/client-configuration.md) work with sentinel mode for example passwords

```javascript
createSentinel({
  // ...
  nodeClientOptions: {
    password: password,
  },
});
```

## Master client lease

Sometimes multiple commands needs to run on an exclusive client (for example, using `WATCH/MULTI/EXEC`).

There are 2 ways to get a client lease:

`.use()`
```javascript
const result = await sentinel.use(async client => {
  await client.watch('key');
  return client.multi()
    .get('key')
    .exec();
});
```

`.acquire()`
```javascript
const clientLease = await sentinel.acquire();

try {
  await clientLease.watch('key');
  const resp = await clientLease.multi()
    .get('key')
    .exec();
} finally {
  clientLease.release();
}
```

## Scan Iterator

The sentinel client supports `scanIterator` for iterating over keys on the master node:

```javascript
for await (const keys of sentinel.scanIterator()) {
  // ...
}
```

### Behaviour on master failover

SCAN cursors are node-local — a cursor returned by one Redis instance is meaningless on any other instance. Because of this, the sentinel iterator cannot transparently survive a master failover: the in-flight cursor cannot be resumed on the promoted replica, and silently restarting from cursor `0` on the new master would hide both duplicate keys (already yielded from the old master) and data loss (writes that had not yet replicated before the failover).

If a `MASTER_CHANGE` topology event is observed while an iteration is in progress **and** the iterator still needs to issue another `SCAN` (i.e. the cursor has not yet returned to `0`), it throws `ScanIteratorInterruptedError` rather than send a stale, node-local cursor to a different master. The caller decides whether to retry the iteration from scratch, accept the partial result, or fail the surrounding operation.

If the responding master returns `cursor=0` on the same call during which `MASTER_CHANGE` fires, no error is thrown — that node honored SCAN's contract ("every key present at iteration start was returned") and no further calls are needed. SCAN never claims to reflect "the current dataset" at the moment iteration ends, with or without a failover, so this case is not treated as an interruption.

Connection-level errors raised by the underlying client (e.g. `SocketClosedUnexpectedlyError`, `SocketTimeoutError`, `ReconnectStrategyError`) are **not** wrapped. A dropped socket is not by itself evidence of a failover — it may also be a transient network blip on the same master, in which case the cursor is still valid and a higher-level retry policy is appropriate. The original error is propagated as-is, and the caller can distinguish failover from a blip by checking for `ScanIteratorInterruptedError` versus other error types.

In a real failover the dropped socket often precedes the Sentinel `MASTER_CHANGE` event (gated by `down-after-milliseconds`), so callers that want to treat both signals uniformly should catch both `ScanIteratorInterruptedError` **and** connection-class errors:

```javascript
import { ScanIteratorInterruptedError } from '@redis/client';

try {
  for await (const keys of sentinel.scanIterator()) {
    // ...
  }
} catch (err) {
  if (err instanceof ScanIteratorInterruptedError) {
    // master failed over mid-iteration; restart from the beginning if desired
  } else {
    throw err;
  }
}
```

The iterator listens for the `topology-change` event with `type: "MASTER_CHANGE"`. The listener is attached when the generator body first runs (on the first `.next()` call) and is detached in a `finally` block, so an early `break` out of the `for await` loop will not leak listeners.

The standalone `RedisClient.scanIterator()` still inherits SCAN's documented guarantees, including the possibility of returning the same key multiple times within a single iteration; see the [SCAN guarantees](https://redis.io/docs/latest/commands/scan/#scan-guarantees) page.

### Pool behaviour

The iterator acquires a master client lease only for the duration of each `SCAN` call and releases it before yielding to the consumer. This means commands issued from inside the `for await` loop body (e.g. `sentinel.mGet(keys)`) will not deadlock against the iterator, even with the default `masterPoolSize` of `1`.
