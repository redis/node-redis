# Node-Redis

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

> :warning: You **MUST** listen to `error` events. If a client doesn't have at least one `error` listener registered and an `error` occurs, that error will be thrown and the Node.js process will exit. See the [`EventEmitter` docs](https://nodejs.org/api/events.html#error-events) for more details.

The above code connects to localhost on port 6379. To connect to a different host or port, use a connection string in the format `redis[s]://[[username][:password]@][host][:port][/db-number]`:

```javascript
createClient({
  url: 'redis://alice:foobared@awesome.redis.server:6380'
});
```

You can also use discrete parameters, UNIX sockets, and even TLS to connect. Details can be found in the [client configuration guide](../../docs/client-configuration.md).

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

> NOTE: command modifiers that change the reply type (e.g. `WITHSCORES` for `ZDIFF`) are exposed as separate commands (e.g. `ZDIFF_WITHSCORES`/`zDiffWithScores`).

Replies will be mapped to useful data structures:

```javascript
await client.hGetAll('key'); // { field1: 'value1', field2: 'value2' }
await client.hVals('key'); // ['value1', 'value2']
```

> NOTE: you can change the default type mapping. See the [Type Mapping](../../docs/command-options.md#type-mapping) documentation for more information.

### Unsupported Redis Commands

If you want to run commands and/or use arguments that Node Redis doesn't know about (yet!) use `.sendCommand()`:

```javascript
await client.sendCommand(['SET', 'key', 'value', 'EX', '10', 'NX']); // 'OK'
await client.sendCommand(['HGETALL', 'key']); // ['key1', 'field1', 'key2', 'field2']
```

### Disconnecting

#### `.close()`

Gracefully close a client's connection to Redis.
Wait for commands in process, but reject any new commands.

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

> `.close()` is just like `.quit()` which was depreacted v5. See the [relevant section in the migration guide](../../docs/v4-to-v5.md#Quit-VS-Disconnect) for more information.

#### `.destroy()`

Forcibly close a client's connection to Redis.

```javascript
try {
  const promise = Promise.all([
    client.ping(),
    client.get('key')
  ]);

  client.destroy();

  await promise;
} catch (err) {
  // DisconnectsClientError
}

try {
  await client.get('key');
} catch (err) {
  // ClientClosedError
}
```

> `.destroy()` is just like `.disconnect()` which was depreated in v5. See the [relevant section in the migration guide](../../docs/v4-to-v5.md#Quit-VS-Disconnect) for more information.

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

### Connection State

To client exposes 2 `boolean`s that track the client state:
1. `isOpen` - the client is either connecting or connected.
2. `isReady` - the client is connected and ready to send 

### Events

The client extends `EventEmitter` and emits the following events:

| Name                    | When                                                                               | Listener arguments                                         |
|-------------------------|------------------------------------------------------------------------------------|------------------------------------------------------------|
| `connect`               | Initiating a connection to the server                                              | *No arguments*                                             |
| `ready`                 | Client is ready to use                                                             | *No arguments*                                             |
| `end`                   | Connection has been closed (via `.quit()` or `.disconnect()`)                      | *No arguments*                                             |
| `error`                 | An error has occurred—usually a network issue such as "Socket closed unexpectedly" | `(error: Error)`                                           |
| `reconnecting`          | Client is trying to reconnect to the server                                        | *No arguments*                                             |
| `sharded-channel-moved` | See [here](../../docs/pub-sub.md#sharded-channel-moved-event)                          | See  [here](../../docs/pub-sub.md#sharded-channel-moved-event) |

> :warning: You **MUST** listen to `error` events. If a client doesn't have at least one `error` listener registered and an `error` occurs, that error will be thrown and the Node.js process will exit. See the [`EventEmitter` docs](https://nodejs.org/api/events.html#error-events) for more details.

### Read more

- [Transactions (`MULTI`/`EXEC`)](../../docs/transactions.md).
- [Pub/Sub](../../docs/pub-sub.md).
- [Scan Iterators](../../docs/scan-iterators.md).
- [Programmability](../../docs/programmability.md).
- [Command Options](../../docs/command-options.md).
- [Pool](../../docs/pool.md).
- [Clustering](../../docs/clustering.md).
- [Sentinel](../../docs/sentinel.md).
- [FAQ](../../docs/FAQ.md).

## Supported Redis versions

Node Redis is supported with the following versions of Redis:

| Version | Supported          |
|---------|--------------------|
| 7.2.z   | :heavy_check_mark: |
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
