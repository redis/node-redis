# Command Options

> :warning: The command options API in v5 has breaking changes from the previous version. For more details, refer to the [v4-to-v5 guide](./v4-to-v5.md#command-options).

Command Options are used to create "proxy clients" that change the behavior of executed commands. See the sections below for details.

## Type Mapping

Some [RESP types](./RESP.md) can be mapped to more than one JavaScript type. For example, "Blob String" can be mapped to `string` or `Buffer`. You can override the default type mapping using the `withTypeMapping` function:

```javascript
import { RESP_TYPES } from 'redis';

await client.get('key'); // `string | null`

const proxyClient = client.withTypeMapping({
  [RESP_TYPES.BLOB_STRING]: Buffer
});

await proxyClient.get('key'); // `Buffer | null`
```

See [RESP](./RESP.md) for a full list of types.

### `DUMP`/`RESTORE` and Binary Data

[`DUMP`](https://redis.io/commands/dump/) returns serialized binary data. If blob strings are decoded as `string` (the default), the payload can be lossy and [`RESTORE`](https://redis.io/commands/restore/) may fail with `ERR DUMP payload version or checksum are wrong`.

Use `Buffer` mapping for blob strings:

```javascript
import { createClient, RESP_TYPES } from 'redis';

const client = createClient().withTypeMapping({
  [RESP_TYPES.BLOB_STRING]: Buffer
});

const dump = await client.dump('source');
await client.restore('destination', 0, dump);
```

You can also set it as a default:

```javascript
const client = createClient({
  commandOptions: {
    typeMapping: {
      [RESP_TYPES.BLOB_STRING]: Buffer
    }
  }
});
```

In v5, use `withTypeMapping` or `createClient({ commandOptions: { typeMapping } })` instead of the v4 `client.commandOptions({ returnBuffers: true })` call style.

## Abort Signal

The client [batches commands](./FAQ.md#how-are-commands-batched) before sending them to Redis. Commands that haven't been written to the socket yet can be aborted using the [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) API:

```javascript
const controller = new AbortController(),
  abortableClient = client.withAbortSignal(controller.signal);

try {
  const promise = abortableClient.get('key');
  controller.abort();
  await promise;
} catch (err) {
  // AbortError
}
```

Without [`rejectInFlight`](#in-flight-commands-rejectinflight), aborting has no effect on a command that was already written.


## Timeout

This option is similar to the Abort Signal one, but provides an easier way to set timeout for commands. Again, without [`rejectInFlight`](#in-flight-commands-rejectinflight), this applies only to commands that haven't been written to the socket yet. Such a command rejects with `TimeoutError` and is never sent.

Since v6, `commandOptions.timeout` defaults to `5000` (5 seconds). Set it to `undefined` (or `0`) to disable.

```javascript
const client = createClient({
  commandOptions: {
    timeout: 1000
  }
})
```

### Transactions and pipelines

`multi().exec()` and `multi().execAsPipeline()` apply the timeout and the abort signal to the batch as a whole. If either fires before the first command of the batch is written, every command of the batch is rejected and nothing is sent. Once the batch starts writing, it runs to the end. A transaction cancelled this way keeps the client's `WATCH` state.

With [`rejectInFlight`](#in-flight-commands-rejectinflight), the timeout and the abort signal stay active until the last reply of the batch. If either fires after part of the batch was written, every pending command of the batch rejects with the read error, and the rest of the batch is still written. The connection is never left inside `MULTI`.

```javascript
await client.withCommandOptions({ timeout: 1000 })
  .multi()
  .incr('counter')
  .get('counter')
  .exec();
```

## In-flight commands (`rejectInFlight`)

> :warning: Experimental. The API can change in a minor release.

By default, `timeout` and `abortSignal` stop at the moment a command is written to the socket. If the reply is slow, the call waits for it. Set `rejectInFlight: true` to make them apply until the reply arrives:

```javascript
import { TimeoutReadError } from 'redis';

try {
  await client.withCommandOptions({ timeout: 1000, rejectInFlight: true }).get('key');
} catch (err) {
  if (err instanceof TimeoutReadError) {
    // The command was sent and may have been executed.
  }
}
```

You can also set it for every command of a client, cluster, sentinel or pool:

```javascript
const client = createClient({
  commandOptions: {
    timeout: 1000,
    rejectInFlight: true
  }
});
```

| `rejectInFlight` | Fires while | Command kind | Result |
|---|---|---|---|
| `false` / unset | waiting to be sent | any | `TimeoutError` / `AbortError`, never sent |
| `false` / unset | sent, waiting for reply | any | no effect |
| `true` | waiting to be sent | any | `TimeoutError` / `AbortError`, never sent |
| `true` | sent, waiting for reply | non-blocking | `TimeoutReadError` / `AbortReadError`, reply dropped |
| `true` | sent, waiting for reply | blocking | timeout: no effect; abort: `AbortReadError`, reply dropped |
| `true` | sent, during maintenance | non-blocking | `CommandTimeoutReadDuringMaintenanceError` |

The error tells you whether the command reached the server:

| Error | Sent to server? | Safe to retry? |
|---|---|---|
| `TimeoutError` | No | Yes |
| `AbortError` | No | Yes |
| `CommandTimeoutDuringMaintenanceError` (extends `TimeoutError`) | No | Yes |
| `TimeoutReadError` | Yes; may have run | Only if idempotent |
| `AbortReadError` | Yes; may have run | Only if idempotent |
| `CommandTimeoutReadDuringMaintenanceError` (extends `TimeoutReadError`) | Yes; may have run | Only if idempotent |
| `SocketTimeoutDuringMaintenanceError` (extends `TimeoutReadError`) | Yes; may have run | Only if idempotent |

Two read errors do not need `rejectInFlight`:

- `TimeoutReadError`: a cluster slot migration waits up to 5 seconds for the replies of the source node, then rejects the commands that are still waiting.
- `SocketTimeoutDuringMaintenanceError`: the socket received no data for the maintenance timeout and was closed. In earlier versions this error extended `TimeoutError`.

`TimeoutReadError` is not an instance of `TimeoutError`, and `AbortReadError` is not an instance of `AbortError`.

Things to know:

- **The connection stays open.** The client keeps the rejected command's place in the reply order and drops its reply when it arrives. Later commands on the same connection still wait behind it on the server: a command whose reply never comes keeps them waiting.
- **Blocking commands** (`BLPOP`, `XREAD`, `WAIT`, ...) are not timed out after they are sent, because the server keeps blocking anyway. Use the command's own timeout argument. `abortSignal` still applies to them. `XREAD` and `XREADGROUP` count as blocking even without `BLOCK`.
- **Session state is unknown after a read error.** If the command changes connection state (for example `SELECT`), repeat it, or turn the flag off for that call.
- **Commands split across cluster shards.** A multi-key command such as `MSET` or `DEL` runs as one command per shard. If one part fails, the others may already have run, even when the error is `TimeoutError` or `AbortError`.
- **Event-loop stalls.** If the event loop is blocked for longer than the timeout, a command can reject with a read error even though its reply already arrived.

## ASAP

Commands that are executed in the "asap" mode are added to the beginning of the "to send" queue.

```javascript
const asapClient = client.asap();
await asapClient.ping();
```

## Client Side Caching

When [client side caching](./client-side-caching.md) is enabled, the `cache` option states whether the application wants a reply cached: `true` caches it if the command is eligible, `false` never caches it. It overrides the `cacheable` predicate and the [tracking mode](./client-side-caching.md#tracking-modes) default. Without `clientSideCache`, it has no effect.

```javascript
await client.withCommandOptions({ cache: true }).get('user:42');

const uncached = client.withCommandOptions({ cache: false });
await uncached.get('counter:hits');
```

Commands sent with `sendCommand` bypass the cache, so the option has no effect there.

## `withCommandOptions`

You can set all of the above command options in a single call with the `withCommandOptions` function:

```javascript
client.withCommandOptions({
  typeMapping: ...,
  abortSignal: ...,
  timeout: ...,
  asap: ...
});
```

If any of the above options are omitted, the default value will be used. For example, the following client would **not** be in ASAP mode:

```javascript
client.asap().withCommandOptions({
  typeMapping: ...,
  abortSignal: ...,
  timeout: ...
});
```
