# v4 to v5 migration guide

## Commands

Some command arguments/replies changed to be more aligned with Redis:

- `ACL GETUSER`: `selectors`
- `CLIENT KILL`: `enum ClientKillFilters` -> `const CLIENT_KILL_FILTERS` [^enum-to-constants]
- `CLUSTER FAILOVER`: `enum FailoverModes` -> `const FAILOVER_MODES` [^enum-to-constants]
- `LCS IDX`: `length` has been changed to `len`, `matches` has been changed from `Array<{ key1: RangeReply; key2: RangeReply; }>` to `Array<[key1: RangeReply, key2: RangeReply]>`
- `HEXISTS`: `boolean` -> `number` [^boolean-to-number]
- `HRANDFIELD_COUNT_WITHVALUES`: `Record<BlobString, BlobString>` -> `Array<{ field: BlobString; value: BlobString; }>` (it can return duplicates).
- `SCAN`, `HSCAN`, `SSCAN`, and `ZSCAN`: cursor type is `string` instead of `number`?
- `HSETNX`: `boolean` -> `number` [^boolean-to-number]
- `ZINTER`: instead of `client.ZINTER('11, { WEIGHTS: [1] })` use `client.ZINTER({ key: '1', weight: 1 }])`
- `SETNX`: `boolean` -> `number` [^boolean-to-number]
- `COPY`: `destinationDb` -> `DB`, `replace` -> `REPLACE`, `boolean` -> `number` [^boolean-to-number]
- `EXPIRE`: `boolean` -> `number` [^boolean-to-number]
- `EXPIREAT`: `boolean` -> `number` [^boolean-to-number]
- `MOVE`: `boolean` -> `number` [^boolean-to-number]
- `PEXPIRE`: `boolean` -> `number` [^boolean-to-number]
- `PEXPIREAT`: `boolean` -> `number` [^boolean-to-number]
- `RENAMENX`: `boolean` -> `number` [^boolean-to-number]
- `HSCAN`: `tuples` has been renamed to `entries`
- `PFADD`: `boolean` -> `number` [^boolean-to-number]

[^enum-to-constants]:
  TODO

[^boolean-to-number]
  TODO

## Command Options

in v4, command options are passed as a first optional argument:

```javascript
await client.get('key'); // `string | null`
await client.get(client.commandOptions({ returnBuffers: true }), 'key'); // `Buffer | null`
```

which has a couple of flaws:
1. The arguments types is checked in runtime, which hit performance.
2. Makes code suggestions less readable/usable, due to "function overloading".
3. Overall makes the "user code" not very readable.

### The new API

With the new API instead of passing the options directrly to the commands, we use a "proxy client" to store the options:

```javascript
await client.get('key'); // `string | null`

const proxyClient = client.withCommandOptions({
  flags: {
    [TYPES.BLOB_STRING]: Buffer
  }
});

await proxyClient.get('key'); // `Buffer | null`
```

`withCommandOptions` can be used to override all the command options, without reusing any of the existing ones.
On top of that, these functions can be used to override a specific option:
- `withFlags` - override `flags` only.
- `asap` - override `asap` to `true`.
- `isolated` - override `isolated` to `true`.

## Quit VS Disconnect

close 
quit
disconnect

TODO
