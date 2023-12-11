# Redis Sentinel

The Redis Sentinel object of node-redis provides a high level object that provides access to a high availability redis installation managed by Redis Sentinel to provide enumeration of master and replica nodes belonging to an installation as well as reconfigure itself on demand for failover and topology changes.

## Usage

```typescript
//FIXME: are these imports, correct?
import { createSentinel } from '@redis/client';
import { RedisSentinelOptions } from '@redis/client/sentinel/types';

const options: RedisSentinelOptions = {name: "sentinel-db", sentinelRootNodes: [{host: "example", port: 1234}]};
const sentinel = createSentinel(options);
await sentinel.connect();
```

In the above example, we configure the sentinel object to fetch the configuration for the database Redis Sentinel is monitoring as "sentinel-db" with one of the sentinels being located at `exampe:1234`.

Once one has this object, one can use it like a normal Redis client

```typescript
assert(await sentinel.set('x', 1) == 'OK);
const value = await sentinel.get('x');
```

It supports pubsub via the normal mechanisms, including migrating the listeners if the node they are connected to goes down.

```typescript
await sentinel.subscribe('test', (msg) => {});
await sentinel.unsubscribe('test');
```

The sentinel object provides the ability to direct read only commands against replica nodes if configured to do so

```typescript
const options: RedisSentinelOptions = {
    name: "sentinel-db", 
    sentinelRootNodes: [{host: "example", port: 1234}], 
    useReplicas: true
};
const sentinel = createSentinel(options);
await sentinel.connect();
```

the sentinel object provides the ability to manage a pool of clients for both the master and replicas (if using replica reads)

```typescript
const options: RedisSentinelOptions = {
    name: "sentinel-db", 
    sentinelRootNodes: [{host: "example", port: 1234}], 
    useReplicas: true,
    masterPoolSize: 16,
    replicaPoolSize: 4
};
const sentinel = createSentinel(options);
await sentinel.connect();
```

the sentinel object enables the user to get a persistent client lease against the master replicas, if desired.  For instance, if one wants to perform redis transactions with `WATCH/MULTI/EXEC`

```typescript
const clientLease = await sentinel.getMasterClientLease();
await clientLease.watch("x"); 
const resp = await clientLease.multi().get("x").exec();
clientLease.release();
```

If no clients are available to get a lease, the aquistion will block until a client lease is available.

In addition, even without explicit leases, whenever the sentinel object does actions against the master node (ex: 

```typescript
await sentinel.set('x', 1)`)
```
it will take a temporary lease on a client, so that it will not step on top of any other clients

In addition, the sentinel object provides the `use()` member to provide the ability to pass in a function that takes a `RedisClientType` and this will aquire a lease for the function's execution and release it upon compeletion

```typescript
let promise = sentinel.use(async (client) => {
    await client.set("x", 1);
    await client.watch("x");
    return client.multi().get("x").exec();
});
```

the usages of `use()` can be non reslient (default) where the sentinel client will not attempt to perform them again if the connections breaks in the middle / a topology reconfiguration is required or in a reslient mode where it will retry it when we reconnect to the master.