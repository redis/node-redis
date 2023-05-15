# v4 to v5 migration guide

## Command Options

In v4, command options are passed as a first optional argument:

```javascript
await client.get('key'); // `string | null`
await client.get(client.commandOptions({ returnBuffers: true }), 'key'); // `Buffer | null`
```

This has a couple of flaws:
1. The argument types are checked in runtime, which is a performance hit.
2. Code suggestions are less readable/usable, due to "function overloading".
3. Overall, "user code" is not as readable as it could be.

### The new API for v5

With the new API, instead of passing the options directly to the commands we use a "proxy client" to store them:

```javascript
await client.get('key'); // `string | null`

const proxyClient = client.withCommandOptions({
  flags: {
    [TYPES.BLOB_STRING]: Buffer
  }
});

await proxyClient.get('key'); // `Buffer | null`
```

`withCommandOptions` can be used to override all of the command options, without reusing any existing ones.

To override just a specific option, use the following functions:
- `withFlags` - override `flags` only.
- `asap` - override `asap` to `true`.
- `isolated` - override `isolated` to `true`.

## Quit VS Disconnect

The `QUIT` command has been deprecated in Redis 7.2 and should now also be considered deprecated in Node-Redis. Instead of sending a `QUIT` command to the server, the client can simply close the network connection.

`client.QUIT/quit()` is replaced by `client.close()`. and, to avoid confusion, `client.disconnect()` has been renamed to `client.destroy()`.

## Scan Iterators

TODO
Yields chunks instead of individual items. Allows multi key operations.
See the [Scan Iterators guide](./scan-iterators.md).

## Legacy Mode

TODO

```javascript
const client = createClient(),
  legacyClient = client.legacy();

// use `client` for the new API
await client.set('key', 'value');

// use `legacyClient` for the "legacy" API
legacyClient.set('key', 'value', (err, reply) => {
  // ...
});
```

## Isolation Pool

TODO
The `isolationPool` has been moved to it's on class `ClientPool`. You can create pool from a client using `client.createPool()`.

## Commands

Some command arguments/replies have changed to align more closely to data types returned by Redis:

- `ACL GETUSER`: `selectors`
- `CLIENT KILL`: `enum ClientKillFilters` -> `const CLIENT_KILL_FILTERS` [^enum-to-constants]
- `CLUSTER FAILOVER`: `enum FailoverModes` -> `const FAILOVER_MODES` [^enum-to-constants]
- `LCS IDX`: `length` has been changed to `len`, `matches` has been changed from `Array<{ key1: RangeReply; key2: RangeReply; }>` to `Array<[key1: RangeReply, key2: RangeReply]>`
- `HEXISTS`: `boolean` -> `number` [^boolean-to-number]
- `HRANDFIELD_COUNT_WITHVALUES`: `Record<BlobString, BlobString>` -> `Array<{ field: BlobString; value: BlobString; }>` (it can return duplicates).
- `SCAN`, `HSCAN`, `SSCAN`, and `ZSCAN`: cursor type is `string` instead of `number`?
- `HSETNX`: `boolean` -> `number` [^boolean-to-number]
- `ZINTER`: instead of `client.ZINTER('key', { WEIGHTS: [1] })` use `client.ZINTER({ key: 'key', weight: 1 }])`
- `ZINTER_WITHSCORES`: instead of `client.ZINTER_WITHSCORES('key', { WEIGHTS: [1] })` use `client.ZINTER_WITHSCORES({ key: 'key', weight: 1 }])`
- `ZUNION`: instead of `client.ZUNION('key', { WEIGHTS: [1] })` use `client.ZUNION({ key: 'key', weight: 1 }])`
- `ZUNION_WITHSCORES`: instead of `client.ZUNION_WITHSCORES('key', { WEIGHTS: [1] })` use `client.ZUNION_WITHSCORES({ key: 'key', weight: 1 }])`
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
- `SCRIPT EXISTS`: `Array<boolean>` -> `Array<number>` [^boolean-to-number]
- `SISMEMBER`: `boolean` -> `number` [^boolean-to-number]
- `SMISMEMBER`: `Array<boolean>` -> `Array<number>` [^boolean-to-number]
- `SMOVE`: `boolean` -> `number` [^boolean-to-number]
- `TS.ADD`: `boolean` -> `number` [^boolean-to-number]
- `GEOSEARCH_WITH`/`GEORADIUS_WITH`: `GeoReplyWith` -> `GEO_REPLY_WITH` [^enum-to-constants]
- `GEORADIUSSTORE` -> `GEORADIUS_STORE`
- `GEORADIUSBYMEMBERSTORE` -> `GEORADIUSBYMEMBER_STORE`
- `XACK`: `boolean` -> `number` [^boolean-to-number]
- `XADD`: the `INCR` option has been removed, use `XADD_INCR` instead
- `LASTSAVE`: `Date` -> `number` (unix timestamp)
- `HELLO`: `protover` moved from the options object to it's own argument, `auth` -> `AUTH`, `clientName` -> `SETNAME`
- `MODULE LIST`: `version` -> `ver` [^map-keys]
- `MEMORY STATS`: [^map-keys]

[^enum-to-constants]: TODO

[^boolean-to-number]: TODO

[^map-keys]: [TODO](https://github.com/redis/node-redis/discussions/2506)