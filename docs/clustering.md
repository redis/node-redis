# Clustering

## Basic Example

Connecting to a cluster is a bit different. Create the client by specifying some (or all) of the nodes in your cluster and then use it like a regular client instance:

```javascript
import { createCluster } from 'redis';

const cluster = await createCluster({
    rootNodes: [{
      url: 'redis://10.0.0.1:30001'
    }, {
      url: 'redis://10.0.0.2:30002'
    }]
  })
  .on('error', err => console.log('Redis Cluster Error', err))
  .connect();

await cluster.set('key', 'value');
const value = await cluster.get('key');
await cluster.close();
```

## `createCluster` configuration

> See the [client configuration](./client-configuration.md) page for the `rootNodes` and `defaults` configuration schemas.

| Property               | Default | Description                                                                                                                                                                                                                                                                                                         |
|------------------------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| rootNodes              |         | An array of root nodes that are part of the cluster, which will be used to get the cluster topology. Each element in the array is a client configuration object. There is no need to specify every node in the cluster: 3 should be enough to reliably connect and obtain the cluster configuration from the server |
| defaults               |         | The default configuration values for every client in the cluster.  Use this for example when specifying an ACL user to connect with                                                                                                                                                                                 |
| useReplicas            | `false` | When `true`, distribute load by executing readonly commands (such as `GET`, `GEOSEARCH`, etc.) across all cluster nodes. When `false`, only use master nodes                                                                                                                                                        |
| minimizeConnections    | `false` | When `true`, `.connect()` will only discover the cluster topology, without actually connecting to all the nodes. Useful for short-term or Pub/Sub-only connections.                                                                                                                                                 |
| maxCommandRedirections | `16`    | The maximum number of times a command will be redirected due to `MOVED` or `ASK` errors                                                                                                                                                                                                                             |
| nodeAddressMap         |         | Defines the [node address mapping](#node-address-map)                                                                                                                                                                                                                                                               |
| modules                |         | Included [Redis Modules](../README.md#packages)                                                                                                                                                                                                                                                                     |
| scripts                |         | Script definitions (see [Lua Scripts](./programmability.md#lua-scripts))                                                                                                                                                                                                                                                    |
| functions              |         | Function definitions (see [Functions](./programmability.md#functions))                                                                                                                                                                                                                                                      |

## Usage

Most redis commands are the same as with individual clients.

### Unsupported Redis Commands

If you want to run commands and/or use arguments that Node Redis doesn't know about (yet!) use `.sendCommand()`.

When clustering, `sendCommand` takes 3 arguments to help with routing to the correct redis node:
* `firstKey`: the key that is being operated on, or `undefined` to route to a random node.
* `isReadOnly`: determines if the command needs to go to the master or may go to a replica.
*  `args`: the command and all arguments (including the key), as an array of strings.

```javascript
await cluster.sendCommand("key", false, ["SET", "key", "value", "NX"]); // 'OK'

await cluster.sendCommand("key", true, ["HGETALL", "key"]); // ['key1', 'field1', 'key2', 'field2']
```

## Auth with password and username

Specifying the password in the URL or a root node will only affect the connection to that specific node. In case you want to set the password for all the connections being created from a cluster instance, use the `defaults` option.

```javascript
createCluster({
  rootNodes: [{
    url: 'redis://10.0.0.1:30001'
  }, {
    url: 'redis://10.0.0.2:30002'
  }],
  defaults: {
    username: 'username',
    password: 'password'
  }
});
```

## Node Address Map

A mapping between the addresses in the cluster (see `CLUSTER SHARDS`) and the addresses the client should connect to.
Useful when the cluster is running on a different network to the client.

```javascript
const rootNodes = [{
  url: 'external-host-1.io:30001'
}, {
  url: 'external-host-2.io:30002'
}];

// Use either a static mapping:
createCluster({
  rootNodes,
  nodeAddressMap: {
    '10.0.0.1:30001': {
      host: 'external-host.io',
      port: 30001
    },
    '10.0.0.2:30002': {
      host: 'external-host.io',
      port: 30002
    }
  }
});

// or create the mapping dynamically, as a function:
createCluster({
  rootNodes,
  nodeAddressMap(address) {
    const indexOfDash = address.lastIndexOf('-'),
      indexOfDot = address.indexOf('.', indexOfDash),
      indexOfColons = address.indexOf(':', indexOfDot);
    
    return {
      host: `external-host-${address.substring(indexOfDash + 1, indexOfDot)}.io`,
      port: Number(address.substring(indexOfColons + 1))
    };
  }
});
```

> This is a common problem when using ElastiCache. See [Accessing ElastiCache from outside AWS](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/accessing-elasticache.html) for more information on that.
>
> **Azure Managed Redis Note**: If using Azure Managed Redis with private endpoints, you may need to configure `nodeAddressMap` to map internal IP addresses to accessible hostnames. See [Azure Managed Redis Clustering](https://learn.microsoft.com/en-us/azure/redis/architecture#clustering) for configuration details.

### Events

The Node Redis Cluster class extends Node.js’s EventEmitter and emits the following events:

| Name                    | When                                                                               | Listener arguments                                        |
| ----------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `connect`               | The cluster has successfully connected and is ready to us                          | _No arguments_                                            |
| `disconnect`            | The cluster has disconnected                                                       | _No arguments_                                            |
| `error`                 | The cluster has errored                                                            | `(error: Error)`                                          |
| `node-ready`            | A cluster node is ready to establish a connection                                  | `(node: { host: string, port: number })`                  |
| `node-connect`          | A cluster node has connected                                                       | `(node: { host: string, port: number })`                  |
| `node-reconnecting`     | A cluster node is attempting to reconnect after an error                           | `(node: { host: string, port: number })`                  |
| `node-disconnect`       | A cluster node has disconnected                                                    | `(node: { host: string, port: number })`                  |
| `node-error`            | A cluster node has has errored (usually during TCP connection)                     | `(error: Error, node: { host: string, port: number })`    |

> :warning: You **MUST** listen to `error` events. If a cluster doesn't have at least one `error` listener registered and
> an `error` occurs, that error will be thrown and the Node.js process will exit. See the [ > `EventEmitter` docs](https://nodejs.org/api/events.html#events_error_events) for more details.

## Command Routing

### Commands that operate on Redis Keys

Commands such as `GET`, `SET`, etc. are routed by the first key specified. For example `MGET 1 2 3` will be routed by the key `1`.

### [Server Commands](https://redis.io/commands#server)

Admin commands such as `MEMORY STATS`, `FLUSHALL`, etc. are not attached to the cluster, and must be executed on a specific node via `.getSlotMaster()`.

### "Forwarded Commands"

Certain commands (e.g. `PUBLISH`) are forwarded to other cluster nodes by the Redis server. The client sends these commands to a random node in order to spread the load across the cluster.

## Troubleshooting

### MOVED Errors

If your application receives persistent `MOVED` errors, this typically indicates:

1. **Topology Changes**: The cluster topology has changed (slots migrated between nodes). The client should automatically handle this with `rediscover()`.

2. **Connection Issues**: Corrupted or stale connections may cause repeated MOVED errors. The client now automatically:
   - Disconnects problematic connections when MOVED is detected
   - Forces creation of fresh connections during rediscover
   - Tries the node specified in the MOVED error directly

If MOVED errors persist, consider:
- Monitoring `node-error` events to track connection issues
- Increasing `maxCommandRedirections` if retries are being exhausted
- Using `nodeAddressMap` if nodes aren't discoverable (common with private endpoints)

### Azure Managed Redis with Private Endpoints

When using Azure Managed Redis with private endpoints, configure `nodeAddressMap` to map internal IP addresses:

```javascript
const cluster = createCluster({
  rootNodes: [{ url: `rediss://${hostname}:10000` }],
  nodeAddressMap: (address) => {
    // Map internal IPs to the accessible hostname
    return { host: hostname, port: parseInt(address.split(':')[1]) };
  },
  defaults: {
    password,
    socket: {
      tls: true,
      servername: hostname
    }
  }
});

cluster.on('error', (error) => {
  console.error('Cluster error:', error.message);
});

cluster.on('node-error', (error, node) => {
  console.warn(`Node ${node.host}:${node.port} error:`, error.message);
});
```

---

