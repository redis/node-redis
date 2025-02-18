# `createClient` configuration

| Property                     | Default                                  | Description                                                                                                                                                                                                                                         |
|------------------------------|------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| url                          |                                          | `redis[s]://[[username][:password]@][host][:port][/db-number]` (see [`redis`](https://www.iana.org/assignments/uri-schemes/prov/redis) and [`rediss`](https://www.iana.org/assignments/uri-schemes/prov/rediss) IANA registration for more details) |
| socket                       |                                          | Socket connection properties. Unlisted [`net.connect`](https://nodejs.org/api/net.html#socketconnectoptions-connectlistener) properties (and [`tls.connect`](https://nodejs.org/api/tls.html#tlsconnectoptions-callback)) are also supported        |
| socket.port                  | `6379`                                   | Redis server port                                                                                                                                                                                                                                   |
| socket.host                  | `'localhost'`                            | Redis server hostname                                                                                                                                                                                                                               |
| socket.family                | `0`                                      | IP Stack version (one of `4 \| 6 \| 0`)                                                                                                                                                                                                             |
| socket.path                  |                                          | Path to the UNIX Socket                                                                                                                                                                                                                             |
| socket.connectTimeout        | `5000`                                   | Connection timeout (in milliseconds)                                                                                                                                                                                                                |
| socket.noDelay               | `true`                                   | Toggle [`Nagle's algorithm`](https://nodejs.org/api/net.html#net_socket_setnodelay_nodelay)                                                                                                                                                         |
| socket.keepAlive             | `true`                                   | Toggle [`keep-alive`](https://nodejs.org/api/net.html#socketsetkeepaliveenable-initialdelay) functionality                                                                                                                                          |
| socket.keepAliveInitialDelay | `5000`                                   | If set to a positive number, it sets the initial delay before the first keepalive probe is sent on an idle socket                                                                                                                                   |
| socket.tls                   |                                          | See explanation and examples [below](#TLS)                                                                                                                                                                                                          |
| socket.reconnectStrategy     | Exponential backoff with a maximum of 2000 ms; plus 0-200 ms random jitter.       | A function containing the [Reconnect Strategy](#reconnect-strategy) logic                                                                                                                                                                           |
| username                     |                                          | ACL username ([see ACL guide](https://redis.io/topics/acl))                                                                                                                                                                                         |
| password                     |                                          | ACL password or the old "--requirepass" password                                                                                                                                                                                                    |
| name                         |                                          | Client name ([see `CLIENT SETNAME`](https://redis.io/commands/client-setname))                                                                                                                                                                      |
| database                     |                                          | Redis database number (see [`SELECT`](https://redis.io/commands/select) command)                                                                                                                                                                    |
| modules                      |                                          | Included [Redis Modules](../README.md#packages)                                                                                                                                                                                                     |
| scripts                      |                                          | Script definitions (see [Lua Scripts](../README.md#lua-scripts))                                                                                                                                                                                    |
| functions                    |                                          | Function definitions (see [Functions](../README.md#functions))                                                                                                                                                                                      |
| commandsQueueMaxLength       |                                          | Maximum length of the client's internal command queue                                                                                                                                                                                               |
| disableOfflineQueue          | `false`                                  | Disables offline queuing, see [FAQ](./FAQ.md#what-happens-when-the-network-goes-down)                                                                                                                                                               |
| readonly                     | `false`                                  | Connect in [`READONLY`](https://redis.io/commands/readonly) mode                                                                                                                                                                                    |
| legacyMode                   | `false`                                  | Maintain some backwards compatibility (see the [Migration Guide](./v3-to-v4.md))                                                                                                                                                                    |
| isolationPoolOptions         |                                          | An object that configures a pool of isolated connections, If you frequently need isolated connections, consider using [createClientPool](https://github.com/redis/node-redis/blob/master/docs/pool.md#creating-a-pool) instead                                                                                                     |
| pingInterval                 |                                          | Send `PING` command at interval (in ms). Useful with ["Azure Cache for Redis"](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-best-practices-connection#idle-timeout)                                                          |

## Reconnect Strategy

When the socket closes unexpectedly (without calling `.quit()`/`.disconnect()`), the client uses `reconnectStrategy` to decide what to do. The following values are supported:
1. `false` -> do not reconnect, close the client and flush the command queue.
2. `number` -> wait for `X` milliseconds before reconnecting.
3. `(retries: number, cause: Error) => false | number | Error` -> `number` is the same as configuring a `number` directly, `Error` is the same as `false`, but with a custom error.

By default the strategy uses exponential backoff, but it can be overwritten like so:

```javascript
createClient({
  socket: {
    reconnectStrategy: retries => {
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
## Connection Pooling

In most cases, a single Redis connection is sufficient, as the node-redis client efficiently handles commands using an underlying socket. Unlike traditional databases, Redis does not require connection pooling for optimal performance.

However, if your use case requires exclusive connections see [RedisClientPool](https://github.com/redis/node-redis/blob/master/docs/pool.md), which allows you to create and manage multiple dedicated connections.

