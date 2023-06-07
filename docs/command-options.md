# Command Options

> :warning: The command options API in v5 has breaking changes from the previous version. For more details, refer to the [v4-to-v5 guide](./v4-to-v5.md#command-options).

TODO: "proxy client" concept

## Type Mapping

TODO [RESP](./RESP.md)

`withTypeMapping`

```javascript
await client.get('key'); // `string | null`

const proxyClient = client.withTypeMapping({
  [TYPES.BLOB_STRING]: Buffer
});

await proxyClient.get('key'); // `Buffer | null`
```

## Abort Signal

TODO

`withAbortSignal`

## ASAP

TODO

`asap`

## `withCommandOptions`

TODO
