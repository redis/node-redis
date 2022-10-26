# Clustering

## Basic Example

Connecting to a cluster is a bit different. Create the client by specifying some (or all) of the nodes in your cluster and then use it like a regular client instance:

```typescript
import { createCluster } from 'redis';

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
```

## `createCluster` configuration

> See the [client configuration](./client-configuration.md) page for the `rootNodes` and `defaults` configuration schemas.

| Property               | Default | Description                                                                                                                                                                                                                                                                                                         |
|------------------------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| rootNodes              |         | An array of root nodes that are part of the cluster, which will be used to get the cluster topology. Each element in the array is a client configuration object. There is no need to specify every node in the cluster, 3 should be enough to reliably connect and obtain the cluster configuration from the server |
| defaults               |         | The default configuration values for every client in the cluster.  Use this for example when specifying an ACL user to connect with                                                                                                                                                                                 |
| useReplicas            | `false` | When `true`, distribute load by executing readonly commands (such as `GET`, `GEOSEARCH`, etc.) across all cluster nodes. When `false`, only use master nodes                                                                                                                                                        |
| maxCommandRedirections | `16`    | The maximum number of times a command will be redirected due to `MOVED` or `ASK` errors                                                                                                                                                                                                                             |
| nodeAddressMap         |         | Defines the [node address mapping](#node-address-map)                                                                                                                                                                                                                                                               |
| modules                |         | Included [Redis Modules](../README.md#packages)                                                                                                                                                                                                                                                                     |
| scripts                |         | Script definitions (see [Lua Scripts](../README.md#lua-scripts))                                                                                                                                                                                                                                                    |
| functions              |         | Function definitions (see [Functions](../README.md#functions))                                                                                                                                                                                                                                                      |

## Node Address Map

A node address map is required when a Redis cluster is configured with addresses that are inaccessible by the machine running the Redis client.
This is a mapping of addresses and ports, with the values being the accessible address/port combination. Example:

```javascript
createCluster({
  rootNodes: [{
    url: 'external-host-1.io:30001'
  }, {
    url: 'external-host-2.io:30002'
  }],
  nodeAddressMap: {
    '10.0.0.1:30001': {
      host: 'external-host-1.io',
      port: 30001
    },
    '10.0.0.2:30002': {
      host: 'external-host-2.io',
      port: 30002
    }
  }
});
```

> This is a common problem when using ElastiCache. See [Accessing ElastiCache from outside AWS](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/accessing-elasticache.html) for more information on that.

## Command Routing

### Commands that operate on Redis Keys

Commands such as `GET`, `SET`, etc. are routed by the first key, for instance `MGET 1 2 3` will be routed by the key `1`.

### [Server Commands](https://redis.io/commands#server)

Admin commands such as `MEMORY STATS`, `FLUSHALL`, etc. are not attached to the cluster, and must be executed on a specific node via `.getSlotMaster()`.

### "Forwarded Commands"

Certain commands (e.g. `PUBLISH`) are forwarded to other cluster nodes by the Redis server. This client sends these commands to a random node in order to spread the load across the cluster.
