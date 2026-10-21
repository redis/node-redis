# F.A.Q.

Nobody has *actually* asked these questions. But, we needed somewhere to put all the important bits and bobs that didn't fit anywhere else. So, here you go!

## What happens when the network goes down?

When a socket closes unexpectedly, all the commands that were already sent will reject as they might have been executed on the server. The rest will remain queued in memory until a new socket is established. If the client is closed—either by returning an error from [`reconnectStrategy`](./client-configuration.md#reconnect-strategy) or by manually calling `.disconnect()`—they will be rejected.

If don't want to queue commands in memory until a new socket is established, set the `disableOfflineQueue` option to `true` in the [client configuration](./client-configuration.md). This will result in those commands being rejected.

## How are commands batched?

Commands are pipelined using [`setImmediate`](https://nodejs.org/api/timers.html#setimmediatecallback-args).

If `socket.write()` returns `false`—meaning that ["all or part of the data was queued in user memory"](https://nodejs.org/api/net.html#net_socket_write_data_encoding_callback:~:text=all%20or%20part%20of%20the%20data%20was%20queued%20in%20user%20memory)—the commands will stack in memory until the [`drain`](https://nodejs.org/api/net.html#net_event_drain) event is fired.

## How do I share a client between modules?

Create and connect the client in one module, then import it wherever it is needed. For example, in a Node.js project with `"type": "module"` in `package.json`:

```javascript
// redis-client.js
import { createClient } from 'redis';

export const client = createClient();
client.on('error', err => console.error('Redis Client Error', err));

await client.connect();
```

```javascript
// app.js
import { client } from './redis-client.js';

try {
  await client.set('shared-client:example', 'value');
  console.log(await client.get('shared-client:example')); // 'value'
} finally {
  await client.close();
}
```

Imports that resolve to the same module reuse its exported client. The top-level `await` ensures that the connection is ready before importing modules use it. If `connect()` rejects, importing the module rejects too.

Keep the client open while the application needs it and close it when the application shuts down. Modules that use the shared client should not close it after each operation.

## `RedisClientType`

Redis has support for [modules](https://redis.io/modules) and running [Lua scripts](../README.md#lua-scripts) within the Redis context. To take advantage of typing within these scenarios, `RedisClient` and `RedisCluster` should be used with [typeof](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html), rather than the base types `RedisClientType` and `RedisClusterType`.

```typescript
import { createClient } from '@redis/client';

export const client = createClient();

export type RedisClientType = typeof client;
```
