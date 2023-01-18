# `createClient` configuration

| Property                 | Default                                  | Description                                                                                                                                                                                                                                         |
|--------------------------|------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| url                      |                                          | `redis[s]://[[username][:password]@][host][:port][/db-number]` (see [`redis`](https://www.iana.org/assignments/uri-schemes/prov/redis) and [`rediss`](https://www.iana.org/assignments/uri-schemes/prov/rediss) IANA registration for more details) |
| socket                   |                                          | Socket connection properties. Unlisted [`net.connect`](https://nodejs.org/api/net.html#socketconnectoptions-connectlistener) properties (and [`tls.connect`](https://nodejs.org/api/tls.html#tlsconnectoptions-callback)) are also supported        |
| socket.port              | `6379`                                   | Redis server port                                                                                                                                                                                                                                   |
| socket.host              | `'localhost'`                            | Redis server hostname                                                                                                                                                                                                                               |
| socket.family            | `0`                                      | IP Stack version (one of `4 \| 6 \| 0`)                                                                                                                                                                                                             |
| socket.path              |                                          | Path to the UNIX Socket                                                                                                                                                                                                                             |
| socket.connectTimeout    | `5000`                                   | Connection Timeout (in milliseconds)                                                                                                                                                                                                                |
| socket.noDelay           | `true`                                   | Toggle [`Nagle's algorithm`](https://nodejs.org/api/net.html#net_socket_setnodelay_nodelay)                                                                                                                                                         |
| socket.keepAlive         | `5000`                                   | Toggle [`keep-alive`](https://nodejs.org/api/net.html#net_socket_setkeepalive_enable_initialdelay) functionality                                                                                                                                    |
| socket.tls               |                                          | See explanation and examples [below](#TLS)                                                                                                                                                                                                          |
| socket.reconnectStrategy | `retries => Math.min(retries * 50, 500)` | A function containing the [Reconnect Strategy](#reconnect-strategy) logic                                                                                                                                                                           |
| username                 |                                          | ACL username ([see ACL guide](https://redis.io/topics/acl))                                                                                                                                                                                         |
| password                 |                                          | ACL password or the old "--requirepass" password                                                                                                                                                                                                    |
| name                     |                                          | Connection name ([see `CLIENT SETNAME`](https://redis.io/commands/client-setname))                                                                                                                                                                  |
| database                 |                                          | Redis database number (see [`SELECT`](https://redis.io/commands/select) command)                                                                                                                                                                    |
| modules                  |                                          | Included [Redis Modules](../README.md#packages)                                                                                                                                                                                                     |
| scripts                  |                                          | Script definitions (see [Lua Scripts](../README.md#lua-scripts))                                                                                                                                                                                    |
| functions                |                                          | Function definitions (see [Functions](../README.md#functions))                                                                                                                                                                                      |
| commandsQueueMaxLength   |                                          | Maximum length of the client's internal command queue                                                                                                                                                                                               |
| disableOfflineQueue      | `false`                                  | Disables offline queuing, see [FAQ](./FAQ.md#what-happens-when-the-network-goes-down)                                                                                                                                                               |
| readonly                 | `false`                                  | Connect in [`READONLY`](https://redis.io/commands/readonly) mode                                                                                                                                                                                    |
| legacyMode               | `false`                                  | Maintain some backwards compatibility (see the [Migration Guide](./v3-to-v4.md))                                                                                                                                                                    |
| isolationPoolOptions     |                                          | See the [Isolated Execution Guide](./isolated-execution.md)                                                                                                                                                                                         |
| pingInterval             |                                          | Send `PING` command at interval (in ms). Useful with "[Azure Cache for Redis](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-best-practices-connection#idle-timeout)"                                                          |

## Reconnect Strategy

You can implement a custom reconnect strategy as a function:

- Receives the number of retries attempted so far.
- Returns `number | Error`:
    - `number`: wait time in milliseconds prior to attempting a reconnect.
    - `Error`: closes the client and flushes internal command queues.

## TLS

To enable TLS, set `socket.tls` to `true`. Below are some basic examples.

> For configuration options see [tls.connect](https://nodejs.org/api/tls.html#tlsconnectoptions-callback) and [tls.createSecureContext](https://nodejs.org/api/tls.html#tlscreatesecurecontextoptions), as those are the underlying functions used by this library.

### Create a SSL client

```typescript
createClient({
  socket: {
    tls: true,
    ca: '...',
    cert: '...'
  }
});
```

### Create a SSL client using a self-signed certificate

```typescript
createClient({
  socket: {
    tls: true,
    rejectUnauthorized: false,
    cert: '...'
  }
});
```
