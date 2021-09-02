# `createClient` configuration

| Property                 | Default                                  | Description                                                                                                                  |
|--------------------------|------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| socket                   |                                          | Object defining socket connection properties                                                                                 |
| socket.url               |                                          | `[redis[s]:]//[[username][:password]@][host][:port]`                                                                         |
| socket.host              | `'localhost'`                            | Hostname to connect to                                                                                                       |
| socket.port              | `6379`                                   | Port to connect to                                                                                                           |
| socket.username          |                                          | ACL username ([see ACL guide](https://redis.io/topics/acl))                                                                  |
| socket.password          |                                          | ACL password or the old "--requirepass" password                                                                             |
| socket.connectTimeout    | `5000`                                   | The timeout for connecting to the Redis Server (in milliseconds)                                                             |
| socket.noDelay           | `true`                                   | Enable/disable the use of [`Nagle's algorithm`](https://nodejs.org/api/net.html#net_socket_setnodelay_nodelay)               |
| socket.keepAlive         | `5000`                                   | Enable/disable the [`keep-alive`](https://nodejs.org/api/net.html#net_socket_setkeepalive_enable_initialdelay) functionality |
| socket.tls               |                                          | Set to `true` to enable [TLS Configuration](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback)                |
| socket.reconnectStrategy | `retries => Math.min(retries * 50, 500)` | A function containing the [Reconnect Strategy](#reconnect-strategy) logic                                                    |
| modules                  |                                          | Object defining which [Redis Modules](https://redis.io/modules) to include (TODO - document)                                 |
| scripts                  |                                          | Object defining Lua scripts to use with this client.  See [Lua Scripts](../README.md#lua-scripts)                            |
| commandsQueueMaxLength   |                                          | Maximum length of the client's internal command queue                                                                        |
| readonly                 | `false`                                  | Connect in [`READONLY`](https://redis.io/commands/readonly) mode                                                             |
| legacyMode               | `false`                                  | Maintain some backwards compatibility (see the [Migration Guide](v3-to-v4.md))                                               |
| isolationPoolOptions     |                                          | See the [Isolated Execution Guide](./isolated-execution.md)                                                                  |

## Reconnect Strategy

You can implement a custom reconnect strategy as a function that should:

- Receives the number of retries attempted so far.
- Should return `number | Error`:
    - `number`: the time in milliseconds to wait before trying to reconnect again.
    - `Error`: close the client and flush the commands queue.
