# `createClient` configuration

| Property                 | Default                                  | Description                                                                                                                                                                                                                                         |
|--------------------------|------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| url                      |                                          | `redis[s]://[[username][:password]@][host][:port][/db-number]` (see [`redis`](https://www.iana.org/assignments/uri-schemes/prov/redis) and [`rediss`](https://www.iana.org/assignments/uri-schemes/prov/rediss) IANA registration for more details) |
| socket                   |                                          | Object defining socket connection properties. Any [`net.createConnection`](https://nodejs.org/api/net.html#netcreateconnectionoptions-connectlistener) option that is not listed here is supported as well                                          |
| socket.port              | `6379`                                   | Port to connect to                                                                                                                                                                                                                                  |
| socket.host              | `'localhost'`                            | Hostname to connect to                                                                                                                                                                                                                              |
| socket.family            | `0`                                      | Version of IP stack. Must be `4 \| 6 \| 0`. The value `0` indicates that both IPv4 and IPv6 addresses are allowed.                                                                                                                                  |
| socket.path              |                                          | UNIX Socket to connect to                                                                                                                                                                                                                           |
| socket.connectTimeout    | `5000`                                   | The timeout for connecting to the Redis Server (in milliseconds)                                                                                                                                                                                    |
| socket.noDelay           | `true`                                   | Enable/disable the use of [`Nagle's algorithm`](https://nodejs.org/api/net.html#net_socket_setnodelay_nodelay)                                                                                                                                      |
| socket.keepAlive         | `5000`                                   | Enable/disable the [`keep-alive`](https://nodejs.org/api/net.html#net_socket_setkeepalive_enable_initialdelay) functionality                                                                                                                        |
| socket.tls               |                                          | See explanation and examples [below](#TLS)                                                                                                                                                                                                          |
| socket.reconnectStrategy | `retries => Math.min(retries * 50, 500)` | A function containing the [Reconnect Strategy](#reconnect-strategy) logic                                                                                                                                                                           |
| username                 |                                          | ACL username ([see ACL guide](https://redis.io/topics/acl))                                                                                                                                                                                         |
| password                 |                                          | ACL password or the old "--requirepass" password                                                                                                                                                                                                    |
| name                     |                                          | Connection name ([see `CLIENT SETNAME`](https://redis.io/commands/client-setname))                                                                                                                                                                  |
| database                 |                                          | Database number to connect to (see [`SELECT`](https://redis.io/commands/select) command)                                                                                                                                                            |
| modules                  |                                          | Object defining which [Redis Modules](../README.md#packages) to include                                                                                                                                                                             |
| scripts                  |                                          | Object defining Lua Scripts to use with this client (see [Lua Scripts](../README.md#lua-scripts))                                                                                                                                                   |
| commandsQueueMaxLength   |                                          | Maximum length of the client's internal command queue                                                                                                                                                                                               |
| disableOfflineQueue      | `false`                                  | Disables offline queuing, see the [FAQ](./FAQ.md#what-happens-when-the-network-goes-down) for details                                                                                                                                                                                                                                               |
| readonly                 | `false`                                  | Connect in [`READONLY`](https://redis.io/commands/readonly) mode                                                                                                                                                                                    |
| legacyMode               | `false`                                  | Maintain some backwards compatibility (see the [Migration Guide](./v3-to-v4.md))                                                                                                                                                                    |
| isolationPoolOptions     |                                          | See the [Isolated Execution Guide](./isolated-execution.md)                                                                                                                                                                                         |

## Reconnect Strategy

You can implement a custom reconnect strategy as a function:

- Receives the number of retries attempted so far.
- Returns `number | Error`:
    - `number`: the wait time in milliseconds prior attempting to reconnect.
    - `Error`: closes the client and flushes the internal command queues.

## TLS

When creating a client, set `socket.tls` to `true` to enable TLS. Below are some basic examples.

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
