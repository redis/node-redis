# Clustering

## Basic Example

Connecting to a cluster is a bit different. Create the client by specifying some (or all) of the nodes in your cluster and then use it like a regular client instance:

```typescript
import { createCluster } from 'redis';

(async () => {
  const cluster = createCluster({
    rootNodes: [
      {
        url: 'redis://10.0.0.1:30001'
      },
      {
        url: 'redis://10.0.0.2:30002'
      }
    ]
  });

  cluster.on('error', (err) => console.log('Redis Cluster Error', err));

  await cluster.connect();

  await cluster.set('key', 'value');
  const value = await cluster.get('key');
})();
```

## `createCluster` configuration

> See the [client configuration](./client-configuration.md) page for the `rootNodes` and `defaults` configuration schemas.

| Property               | Default | Description                                                                                                                                                                                                                                                                                                         |
|------------------------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| rootNodes              |         | An array of root nodes that are part of the cluster, which will be used to get the cluster topology. Each element in the array is a client configuration object. There is no need to specify every node in the cluster, 3 should be enough to reliably connect and obtain the cluster configuration from the server |
| defaults               |         | The default configuration values for every client in the cluster.  Use this for example when specifying an ACL user to connect with                                                                                                                                                                                 |
| useReplicas            | `false` | When `true`, distribute load by executing readonly commands (such as `GET`, `GEOSEARCH`, etc.) across all cluster nodes. When `false`, only use master nodes                                                                                                                                                        |
| maxCommandRedirections | `16`    | The maximum number of times a command will be redirected due to `MOVED` or `ASK` errors                                                                                                                                                                                                                             |
| modules                |         | Object defining which [Redis Modules](../../README.md#modules) to include                                                                                                                                                                                                                                           |
| scripts                |         | Object defining Lua Scripts to use with this client (see [Lua Scripts](../README.md#lua-scripts))                                                                                                                                                                                                                   |

## Command Routing

### Commands that operate on Redis Keys

Commands such as `GET`, `SET`, etc. will be routed by the first key, for instance `MGET 1 2 3` will be routed by the key `1`.

### [Server Commands](https://redis.io/commands#server)

Admin commands such as `MEMORY STATS`, `FLUSHALL`, etc. are not attached to the cluster, and should be executed on a specific node using `.getSlot()` or `.getAllMasters()`.

### "Forwarded Commands"

Some commands (e.g. `PUBLISH`) are forwarded to other cluster nodes by the Redis server. The client will send these commands to a random node in order to spread the load across the cluster.
