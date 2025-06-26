# Command Options

> :warning: The command options API in v5 has breaking changes from the previous version. For more details, refer to the [v4-to-v5 guide](./v4-to-v5.md#command-options).

Command Options are used to create "proxy clients" that change the behavior of executed commands. See the sections below for details.

## Type Mapping

Some [RESP types](./RESP.md) can be mapped to more than one JavaScript type. For example, "Blob String" can be mapped to `string` or `Buffer`. You can override the default type mapping using the `withTypeMapping` function:

```javascript
await client.get('key'); // `string | null`

const proxyClient = client.withTypeMapping({
  [TYPES.BLOB_STRING]: Buffer
});

await proxyClient.get('key'); // `Buffer | null`
```

See [RESP](./RESP.md) for a full list of types.

## Abort Signal

The client [batches commands](./FAQ.md#how-are-commands-batched) before sending them to Redis. Commands that haven't been written to the socket yet can be aborted using the [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) API:

```javascript
const controller = new AbortController(),
  client = client.withAbortSignal(controller.signal);

try {
  const promise = client.get('key');
  controller.abort();
  await promise;
} catch (err) {
  // AbortError
}
```


## Timeout

This option is similar to the Abort Signal one, but provides an easier way to set timeout for commands. Again, this applies to commands that haven't been written to the socket yet.

```javascript
const client = createClient({
  commandOptions: {
    timeout: 1000
  }
})
```

## ASAP

Commands that are executed in the "asap" mode are added to the beginning of the "to sent" queue.

```javascript
const asapClient = client.asap();
await asapClient.ping();
```

## `withCommandOptions`

You can set all of the above command options in a single call with the `withCommandOptions` function:

```javascript
client.withCommandOptions({
  typeMapping: ...,
  abortSignal: ...,
  asap: ...
});
```

If any of the above options are omitted, the default value will be used. For example, the following client would **not** be in ASAP mode:

```javascript
client.asap().withCommandOptions({
  typeMapping: ...,
  abortSignal: ...
});
```
