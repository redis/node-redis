# Node-Redis

[![Tests](https://img.shields.io/github/actions/workflow/status/redis/node-redis/tests.yml?branch=master)](https://github.com/redis/node-redis/actions/workflows/tests.yml)
[![Coverage](https://codecov.io/gh/redis/node-redis/branch/master/graph/badge.svg?token=xcfqHhJC37)](https://codecov.io/gh/redis/node-redis)
[![License](https://img.shields.io/github/license/redis/node-redis.svg)](https://github.com/redis/node-redis/blob/master/LICENSE)

[![Discord](https://img.shields.io/discord/697882427875393627.svg?style=social&logo=discord)](https://discord.gg/redis)
[![Twitch](https://img.shields.io/twitch/status/redisinc?style=social)](https://www.twitch.tv/redisinc)
[![YouTube](https://img.shields.io/youtube/channel/views/UCD78lHSwYqMlyetR0_P4Vig?style=social)](https://www.youtube.com/redisinc)
[![Twitter](https://img.shields.io/twitter/follow/redisinc?style=social)](https://twitter.com/redisinc)

node-redis is a modern, high performance [Redis](https://redis.io) client for Node.js.

## Installation

Start a redis via docker:

``` bash
docker run -p 6379:6379 -it redis/redis-stack-server:latest
```

To install node-redis, simply:

```bash
npm install redis
```

Looking for a high-level library to handle object mapping? See [redis-om-node](https://github.com/redis/redis-om-node)!

## Usage

### Basic Example

```javascript
import { createClient } from 'redis';

const client = await createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

await client.set('key', 'value');
const value = await client.get('key');
await client.close();
```

> :warning: You **MUST** listen to `error` events. If a client doesn't have at least one `error` listener registered and an `error` occurs, that error will be thrown and the Node.js process will exit. See the [`EventEmitter` docs](https://nodejs.org/api/events.html#events_error_events) for more details.

The above code connects to localhost on port 6379. To connect to a different host or port, use a connection string in the format `redis[s]://[[username][:password]@][host][:port][/db-number]`:

```javascript
createClient({
  url: 'redis://alice:foobared@awesome.redis.server:6380'
});
```

You can also use discrete parameters, UNIX sockets, and even TLS to connect. Details can be found in the [client configuration guide](../../docs/client-configuration.md).

To check if the the client is connected and ready to send commands, use `client.isReady` which returns a boolean. `client.isOpen` is also available.  This returns `true` when the client's underlying socket is open, and `false` when it isn't (for example when the client is still connecting or reconnecting after a network error).

### Redis Commands

There is built-in support for all of the [out-of-the-box Redis commands](https://redis.io/commands). They are exposed using the raw Redis command names (`HSET`, `HGETALL`, etc.) and a friendlier camel-cased version (`hSet`, `hGetAll`, etc.):

```javascript
// raw Redis commands
await client.HSET('key', 'field', 'value');
await client.HGETALL('key');

// friendly JavaScript commands
await client.hSet('key', 'field', 'value');
await client.hGetAll('key');
```

Modifiers to commands are specified using a JavaScript object:

```javascript
await client.set('key', 'value', {
  expiration: {
    type: 'EX',
    value: 10
  },
  condition: 'NX'
});
```

Replies will be mapped to useful data structures:

```javascript
await client.hGetAll('key'); // { field1: 'value1', field2: 'value2' }
await client.hVals('key'); // ['value1', 'value2']
```

> NOTE: you can change the default type mapping. See the [Type Mapping](../../docs/command-options.md#type-mapping) documentation for more information.

### Unsupported Redis Commands

If you want to run commands and/or use arguments that Node Redis doesn't know about (yet!) use `.sendCommand()`:

```javascript
await client.sendCommand(['SET', 'key', 'value', 'NX']); // 'OK'

await client.sendCommand(['HGETALL', 'key']); // ['key1', 'field1', 'key2', 'field2']
```

### Disconnecting

There are two functions that disconnect a client from the Redis server. In most scenarios you should use `.close()` to ensure that pending commands are sent to Redis before closing a connection.

> :warning: The `.quit()` and `.disconnect()` methods have been deprecated in v5. For more details, refer to the [v4-to-v5 guide](../../docs/v4-to-v5.md#quit-vs-disconnect).

#### `.close()`

```javascript
const [ping, get] = await Promise.all([
  client.ping(),
  client.get('key'),
  client.close()
]); // ['PONG', null]

try {
  await client.get('key');
} catch (err) {
  // ClientClosedError
}
```

> :warning: `.close` is just like `.quit()` which was depreacted in Redis 7.2. See the [relevant section in the migration guide](../../docs/v4-to-v5.md#Quit-VS-Disconnect) for more information.

#### `.destroy()`

Forcibly close a client's connection to Redis immediately. Calling `destroy` will not send further pending commands to the Redis server, or wait for or parse outstanding responses.

### Auto-Pipelining

Node Redis will automatically pipeline requests that are made during the same "tick".

```javascript
client.set('Tm9kZSBSZWRpcw==', 'users:1');
client.sAdd('users:1:tokens', 'Tm9kZSBSZWRpcw==');
```

Of course, if you don't do something with your Promises you're certain to get [unhandled Promise exceptions](https://nodejs.org/api/process.html#process_event_unhandledrejection). To take advantage of auto-pipelining and handle your Promises, use `Promise.all()`.

```javascript
await Promise.all([
  client.set('Tm9kZSBSZWRpcw==', 'users:1'),
  client.sAdd('users:1:tokens', 'Tm9kZSBSZWRpcw==')
]);
```

### Events

The Node Redis client class is an Nodejs EventEmitter and it emits an event each time the network status changes:

| Name                    | When                                                                               | Listener arguments                                         |
|-------------------------|------------------------------------------------------------------------------------|------------------------------------------------------------|
| `connect`               | Initiating a connection to the server                                              | *No arguments*                                             |
| `ready`                 | Client is ready to use                                                             | *No arguments*                                             |
| `end`                   | Connection has been closed (via `.quit()` or `.disconnect()`)                      | *No arguments*                                             |
| `error`                 | An error has occurred—usually a network issue such as "Socket closed unexpectedly" | `(error: Error)`                                           |
| `reconnecting`          | Client is trying to reconnect to the server                                        | *No arguments*                                             |
| `sharded-channel-moved` | See [here](../../docs/pub-sub.md#sharded-channel-moved-event)                          | See  [here](../../docs/pub-sub.md#sharded-channel-moved-event) |

> :warning: You **MUST** listen to `error` events. If a client doesn't have at least one `error` listener registered and an `error` occurs, that error will be thrown and the Node.js process will exit. See the [`EventEmitter` docs](https://nodejs.org/api/events.html#events_error_events) for more details.

> The client will not emit [any other events](../../docs/v3-to-v4.md#all-the-removed-events) beyond those listed above.

### Links

- [Multi](../../docs/multi.md).
- [Pub/Sub](../../docs/pub-sub.md).
- [Scan Iterators](../../docs/scan-iterators.md).
- [Programmability](../../docs/programmability.md).
- [Command Options](../../docs/command-options.md).
- [Pool](../../docs/pool.md).
- [Clustering](../../docs/clustering.md).

## Supported Redis versions

Node Redis is supported with the following versions of Redis:

| Version | Supported          |
|---------|--------------------|
| 7.0.z   | :heavy_check_mark: |
| 6.2.z   | :heavy_check_mark: |
| 6.0.z   | :heavy_check_mark: |
| 5.0.z   | :heavy_check_mark: |
| < 5.0   | :x:                |

> Node Redis should work with older versions of Redis, but it is not fully tested and we cannot offer support.

## Contributing

If you'd like to contribute, check out the [contributing guide](../../CONTRIBUTING.md).

Thank you to all the people who already contributed to Node Redis!

[![Contributors](https://contrib.rocks/image?repo=redis/node-redis)](https://github.com/redis/node-redis/graphs/contributors)

## License

This repository is licensed under the "MIT" license. See [LICENSE](../../LICENSE).
