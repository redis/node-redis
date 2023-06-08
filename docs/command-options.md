# Command Options

> :warning: The command options API in v5 has breaking changes from the previous version. For more details, refer to the [v4-to-v5 guide](./v4-to-v5.md#command-options).

TODO

## Type Mapping

Some RESP types can be mapped to more than one JavaScript type. For example, "Blob String" can be mapped to `string` or `Buffer`.
You can override the default type mapping using the `withTypeMapping` function:

```javascript
await client.get('key'); // `string | null`

const proxyClient = client.withTypeMapping({
  [TYPES.BLOB_STRING]: Buffer
});

await proxyClient.get('key'); // `Buffer | null`
```

See [RESP](./RESP.md) for a full list of types.

## Abort Signal

Commands can be aborted using the [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) API:

```javascript

const controller = new AbortController();
controller.abort();

try {
  await client.withAbortSignal(controller.signal).get('key');
} catch (err) {
  // AbortError
}
```

> NOTE: Commands that are already written to the socket cannot be aborted.

## ASAP

Commands that are executed in the "asap" mode are added to the top of the queue. This is useful to ensure that commands are executed before other commands that are already in the queue.

```javascript
const asapClient = client.asap();

client.on('connect', () => {
  asapClient.clientSetName('my-name')
    .catch(err => console.error('CLIENT SETNAME error', err));
});
```

## `withCommandOptions`

The `withCommandOptions` overrides all of the command options, without reusing any existing ones:

```javascript
const bufferClient = client.withTypeMapping({
  [TYPES.BLOB_STRING]: Buffer
});

await bufferClient.get('key'); // `Buffer | null`

// reset all command options
const defaultClient = client.withCommandOptions({});

await defaultClient.get('key'); // `string | null`
```
