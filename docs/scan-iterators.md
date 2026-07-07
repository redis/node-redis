# Scan Iterators

> :warning: The scan iterators API in v5 has breaking changes from the previous version. For more details, refer to the [v4-to-v5 guide](./v4-to-v5.md#scan-iterators).

[`SCAN`](https://redis.io/commands/scan) results can be looped over using [async iterators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator):

```javascript
for await (const keys of client.scanIterator()) {
  const values = await client.mGet(keys);
}
```

> :warning: **`keyPrefix` gotcha:** When the client is configured with a [`keyPrefix`](./client-configuration.md#key-prefixing), `scanIterator` yields the **already-prefixed** keys as stored on the server (replies are never un-prefixed). Passing them straight back into a key-prefixing command — like the `mGet(keys)` above — prefixes them a **second** time. For example, with `keyPrefix: 'app:'` a yielded `'app:foo'` becomes `'app:app:foo'`, so the `mGet` silently reads the wrong keys. Strip the prefix before reusing the keys, or read them with a separate client that has no `keyPrefix`. (This affects only `scanIterator`; `HSCAN`/`SSCAN`/`ZSCAN` yield fields/members, which are not keys.)

This works with `HSCAN`, `SSCAN`, and `ZSCAN` too:

```javascript
for await (const entries of client.hScanIterator('hash')) {}
for await (const members of client.sScanIterator('set')) {}
for await (const membersWithScores of client.zScanIterator('sorted-set')) {}
```

You can override the default options by providing a configuration object:

```javascript
client.scanIterator({
  cursor: '0', // optional, defaults to '0'
  TYPE: 'string', // `SCAN` only
  MATCH: 'patter*',
  COUNT: 100
});
```
