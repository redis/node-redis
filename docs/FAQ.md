# F.A.Q.

Nobody has *actually* asked these questions. But, we needed somewhere to put all the important bits and bobs that didn't fit anywhere else. So, here you go!

## What happens when the network goes down?

When a socket closes unexpectedly, all the commands that were already sent will reject as they might have been executed on the server. The rest will remain queued in memory until a new socket is established. If the client is closed—either by returning an error from [`reconnectStrategy`](./client-configuration.md#reconnect-strategy) or by manually calling `.disconnect()`—they will be rejected.

If don't want to queue commands in memory until a new socket is established, set the `disableOfflineQueue` option to `true` in the [client configuration](./client-configuration.md). This will result in those commands being rejected.

## How are commands batched?

Commands are pipelined using [`setImmediate`](https://nodejs.org/api/timers.html#setimmediatecallback-args).

If `socket.write()` returns `false`—meaning that ["all or part of the data was queued in user memory"](https://nodejs.org/api/net.html#net_socket_write_data_encoding_callback:~:text=all%20or%20part%20of%20the%20data%20was%20queued%20in%20user%20memory)—the commands will stack in memory until the [`drain`](https://nodejs.org/api/net.html#net_event_drain) event is fired.

## `RedisClientType`

Redis has support for [modules](https://redis.io/modules) and running [Lua scripts](../README.md#lua-scripts) within the Redis context. To take advantage of typing within these scenarios, `RedisClient` and `RedisCluster` should be used with [typeof](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html), rather than the base types `RedisClientType` and `RedisClusterType`.

```typescript
import { createClient } from '@redis/client';

export const client = createClient();

export type RedisClientType = typeof client;
```