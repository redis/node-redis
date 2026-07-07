# `createClient` configuration

| Property                     | Default                                  | Description                                                                                                                                                                                                                                         |
|------------------------------|------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| url                          |                                          | `redis[s]://[[username][:password]@][host][:port][/db-number]` (see [`redis`](https://www.iana.org/assignments/uri-schemes/prov/redis) and [`rediss`](https://www.iana.org/assignments/uri-schemes/prov/rediss) IANA registration for more details), or `unix://[[username][:password]@]/path/to/socket[?db=N]` for a UNIX domain socket |
| socket                       |                                          | Socket connection properties. Unlisted [`net.connect`](https://nodejs.org/api/net.html#socketconnectoptions-connectlistener) properties (and [`tls.connect`](https://nodejs.org/api/tls.html#tlsconnectoptions-callback)) are also supported        |
| socket.port                  | `6379`                                   | Redis server port                                                                                                                                                                                                                                   |
| socket.host                  | `'localhost'`                            | Redis server hostname                                                                                                                                                                                                                               |
| socket.servername            |                                          | Server name for the SNI (Server Name Indication) TLS extension. Set this property if the Redis server requires SNI during TLS handshake.                                                                                                                                                                                                                                |
| socket.family                | `0`                                      | IP Stack version (one of `4 \| 6 \| 0`)                                                                                                                                                                                                             |
| socket.path                  |                                          | Path to the UNIX Socket                                                                                                                                                                                                                             |
| socket.connectTimeout        | `5000`                                   | Connection timeout (in milliseconds)                                                                                                                                                                                                                |
| socket.socketTimeout           |                                          | The maximum duration (in milliseconds) that the socket can remain idle (i.e., with no data sent or received) before being automatically closed |
| socket.noDelay               | `true`                                   | Toggle [`Nagle's algorithm`](https://nodejs.org/api/net.html#net_socket_setnodelay_nodelay)                                                                                                                                                         |
| socket.keepAlive             | `true`                                   | Toggle [`keep-alive`](https://nodejs.org/api/net.html#socketsetkeepaliveenable-initialdelay) functionality                                                                                                                                          |
| socket.keepAliveInitialDelay | `30000`                                  | If set to a positive number, it sets the initial delay before the first keepalive probe is sent on an idle socket                                                                                                                                   |
| socket.tls                   |                                          | See explanation and examples [below](#TLS)                                                                                                                                                                                                          |
| socket.reconnectStrategy     | Exponential backoff with a maximum of 2000 ms; plus 0-200 ms random jitter.       | A function containing the [Reconnect Strategy](#reconnect-strategy) logic                                                                                                                                                                           |
| username                     |                                          | ACL username ([see ACL guide](https://redis.io/topics/acl))                                                                                                                                                                                         |
| password                     |                                          | ACL password or the old "--requirepass" password                                                                                                                                                                                                    |
| name                         |                                          | Client name ([see `CLIENT SETNAME`](https://redis.io/commands/client-setname))                                                                                                                                                                      |
| database                     |                                          | Redis database number (see [`SELECT`](https://redis.io/commands/select) command)                                                                                                                                                                    |
| keyPrefix                    |                                          | Prefix prepended to every key sent to Redis (ioredis-compatible). See [Key Prefixing](#key-prefixing).                                                                                                                                              |
| modules                      |                                          | Included [Redis Modules](../README.md#packages)                                                                                                                                                                                                     |
| scripts                      |                                          | Script definitions (see [Lua Scripts](../README.md#lua-scripts))                                                                                                                                                                                    |
| functions                    |                                          | Function definitions (see [Functions](../README.md#functions))                                                                                                                                                                                      |
| commandsQueueMaxLength       |                                          | Maximum length of the client's internal command queue                                                                                                                                                                                               |
| disableOfflineQueue          | `false`                                  | Disables offline queuing, see [FAQ](./FAQ.md#what-happens-when-the-network-goes-down)                                                                                                                                                               |
| readonly                     | `false`                                  | Connect in [`READONLY`](https://redis.io/commands/readonly) mode                                                                                                                                                                                    |
| legacyMode                   | `false`                                  | Maintain some backwards compatibility (see the [Migration Guide](./v3-to-v4.md))                                                                                                                                                                    |
| isolationPoolOptions         |                                          | An object that configures a pool of isolated connections, If you frequently need isolated connections, consider using [createClientPool](https://github.com/redis/node-redis/blob/master/docs/pool.md#creating-a-pool) instead                                                                                                     |
| pingInterval                 |                                          | Send `PING` command at interval (in ms). Useful with ["Azure Cache for Redis"](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-best-practices-connection#idle-timeout)                                                          |
| disableClientInfo            | `false`                                  | Disables `CLIENT SETINFO LIB-NAME node-redis` and `CLIENT SETINFO LIB-VER X.X.X` commands                                                                                                                                                           |
| commandOptions.timeout       | `5000`                                   | Default per-command timeout in milliseconds. Set to `undefined` (or `0`) to disable. See [Command Options](./command-options.md).                                                                                                                   |

## Reconnect Strategy

When the socket closes unexpectedly (without calling `.quit()`/`.disconnect()`), the client uses `reconnectStrategy` to decide what to do. The following values are supported:
1. `false` -> do not reconnect, close the client and flush the command queue.
2. `number` -> wait for `X` milliseconds before reconnecting.
3. `(retries: number, cause: Error) => false | number | Error` -> `number` is the same as configuring a `number` directly, `Error` is the same as `false`, but with a custom error.

By default the strategy uses exponential backoff, but it can be overwritten like so:

```javascript
createClient({
  socket: {
    reconnectStrategy: (retries, cause) => {
        // By default, do not reconnect on socket timeout.
        if (cause instanceof SocketTimeoutError) {
          return false;
        }

        // Generate a random jitter between 0 – 200 ms:
        const jitter = Math.floor(Math.random() * 200);
        // Delay is an exponential back off, (times^2) * 50 ms, with a maximum value of 2000 ms:
        const delay = Math.min(Math.pow(2, retries) * 50, 2000);

        return delay + jitter;
    }
  }
});
```

## TLS

To enable TLS, set `socket.tls` to `true`. Below are some basic examples.

> For configuration options see [tls.connect](https://nodejs.org/api/tls.html#tlsconnectoptions-callback) and [tls.createSecureContext](https://nodejs.org/api/tls.html#tlscreatesecurecontextoptions), as those are the underlying functions used by this library.

### Create a SSL client

```javascript
createClient({
  socket: {
    tls: true,
    ca: '...',
    cert: '...'
  }
});
```

### Create a SSL client using a self-signed certificate

```javascript
createClient({
  socket: {
    tls: true,
    rejectUnauthorized: false,
    cert: '...'
  }
});
```
## Key Prefixing

The `keyPrefix` option prepends a prefix to **every key** sent to Redis. It is an ioredis-compatible
way to isolate keyspaces — for example to isolate tests in CI, or to separate the keys of different
parts of an application (web app, background workers, …) that share a single Redis instance.

```javascript
const client = createClient({ keyPrefix: 'app:' });
await client.connect();

await client.set('key', 'value'); // actually stores 'app:key'
await client.get('key');          // reads 'app:key' -> 'value'
```

The prefix is applied uniformly across the standard client, [cluster](./clustering.md),
[sentinel](./sentinel.md), [pool](./pool.md), and inside [transactions and pipelines](./transactions.md).
In cluster mode the slot is computed from the prefixed key, so routing remains correct.

### Semantics (matching ioredis)

- Only keys **sent** to Redis are prefixed. Keys **returned** by Redis are **not** un-prefixed — e.g.
  `KEYS *`, `SCAN`, and `RANDOMKEY` return keys that still include the prefix.
- Because returned keys keep the prefix, **`scanIterator` yields already-prefixed keys**. Feeding
  them straight back into a key-prefixing command double-prefixes them — e.g. with `keyPrefix: 'app:'`,
  a yielded `'app:foo'` passed to `client.mGet(...)` becomes `'app:app:foo'`. Strip the prefix first,
  or use a client without a `keyPrefix`. See [Scan Iterators](./scan-iterators.md).
- `SCAN`/`KEYS`/`HSCAN`/… `MATCH` patterns are **not** auto-prefixed. Include the prefix in the
  pattern yourself if required (e.g. `client.scan('0', { MATCH: 'app:user:*' })`).
- Pub/Sub channels are **not** prefixed (this includes sharded `SPUBLISH`/`SSUBSCRIBE`), since
  channels are a separate namespace from keys.
- The deprecated `parseArgs`/`transformArguments` helper does not apply `keyPrefix`.

`keyPrefix` may be a `string` or a `Buffer`.

## Connection Pooling

In most cases, a single Redis connection is sufficient, as the node-redis client efficiently handles commands using an underlying socket. Unlike traditional databases, Redis does not require connection pooling for optimal performance.

However, if your use case requires exclusive connections see [RedisClientPool](https://github.com/redis/node-redis/blob/master/docs/pool.md), which allows you to create and manage multiple dedicated connections.
