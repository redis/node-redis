# `createClient` configuration

| Property                 | Default                                   | Description                                                          |
|--------------------------|-------------------------------------------|----------------------------------------------------------------------|
| socket                   |                                           |                                                                      |
| socket.url               |                                           | `[redis[s]:]//[[username][:password@]][host][:port]`                 |
| socket.host              | 'localhost'                               |                                                                      |
| socket.port              | 6379                                      |                                                                      |
| socket.username          |                                           | ACL username                                                         |
| socket.password          |                                           | ACL password or the old "--requirepass" password                     |
| socket.tls               |                                           | [](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback) |
| socket.reconnectStrategy | `retries => Math.min(retries * 50, 500)`  | [](#retry-strategy)                                                  |
| modules                  |                                           | [](../README.md#lua-scripts)                                         |
| scripts                  |                                           |                                                                      |
| commandsQueueMaxLength   |                                           |                                                                      |
| readonly                 | false                                     | connect in [`READONLY`](https://redis.io/commands/readonly) mode     |
| legacyMode               | false                                     |                                                                      |
| isolationPoolOptions     |                                           | [Isolated Execution Guide](./isolated-execution.md)                  |

## Reconnect Strategy

Recives the number of retries (in a row)
Should return `number | Error`:
`number` = the ms to wait before trying to reconnect.
`Error` = close the client and flush the commands queue.