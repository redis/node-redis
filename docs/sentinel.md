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
| sentinelRootNodes          |           | An array of root nodes that are part of the sentinel cluster, which will be used to get the topology. Each element in the array is a client configuration object. There is no need to specify every node in the cluster: 3 should be enough to reliably connect and obtain the sentinel configuration from the server |
| maxCommandRediscovers      | `16`      | The maximum number of times a command will retry due to topology changes.                                                                                                                                                                                                                                             |
| nodeClientOptions          |           | The configuration values for every node in the cluster. Use this for example when specifying an ACL user to connect with                                                                                                                                                                                              |
| sentinelClientOptions      |           | The configuration values for every sentinel in the cluster. Use this for example when specifying an ACL user to connect with                                                                                                                                                                                          |
| masterPoolSize             | `1`       | The number of clients connected to the master node                                                                                                                                                                                                                                                                    |
| replicaPoolSize            | `0`       | The number of clients connected to each replica node. When greater than 0, the client will distribute the load by executing read-only commands (such as `GET`, `GEOSEARCH`, etc.) across all the cluster nodes.                                                                                                       |
| nodeAddressMap             |           | Defines the [node address mapping](#node-address-map)                                                                                                                                                                                                                                                                |
| scanInterval               | `10000`   | Interval in milliseconds to periodically scan for changes in the sentinel topology. The client will query the sentinel for changes at this interval.                                                                                                                                                                 |
| passthroughClientErrorEvents | `false` | When `true`, error events from client instances inside the sentinel will be propagated to the sentinel instance. This allows handling all client errors through a single error handler on the sentinel instance.                                                                                                     |
| reserveClient              | `false`   | When `true`, one client will be reserved for the sentinel object. When `false`, the sentinel object will wait for the first available client from the pool.                                                                                                                                                           |

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

### Semantics and differences from standalone `scanIterator`

The standalone `RedisClient.scanIterator()` inherits SCAN's documented guarantees: a full iteration returns every key present from start to end, and may return a key multiple times. See the [SCAN guarantees](https://redis.io/docs/latest/commands/scan/#scan-guarantees) page.

The sentinel iterator adds one extra source of duplicates: **master failover**. If the master changes mid-iteration (detected via the `topology-change` event with `type: "MASTER_CHANGE"`), the cursor is invalidated (SCAN cursors are node-local) and the iterator restarts from cursor `0` on the new master. Keys already yielded before the failover may be yielded again from the new master.

Because Redis replication is asynchronous, the new master may also have a slightly different keyset than the old master at the moment of promotion — writes that had not yet replicated will be missing, and writes accepted on the new master after promotion will be present.

If your processing must be exactly-once, deduplicate with a `Set`:

```javascript
const processed = new Set();
for await (const keys of sentinel.scanIterator()) {
  for (const key of keys) {
    if (processed.has(key)) continue;
    processed.add(key);

    // process key
  }
}
```

For very large keyspaces a `Set` may be memory-prohibitive. A Bloom filter is a lower-memory alternative but is **not** suitable for strict exactly-once processing: its false positives will cause some real keys to be skipped. Use it only when occasional skips are acceptable.

### Pool behaviour

The iterator acquires a master client lease only for the duration of each `SCAN` call and releases it before yielding to the consumer. This means commands issued from inside the `for await` loop body (e.g. `sentinel.mGet(keys)`) will not deadlock against the iterator, even with the default `masterPoolSize` of `1`.
