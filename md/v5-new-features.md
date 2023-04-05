# RESP3 Support

```javascript
client.hGetAll('key'); // Record<string, string>

client.withFlags({
  [TYPES.MAP]: Map
}).hGetAll('key'); // Map<string, string>

client.withFlags({
  [TYPES.MAP]: Map,
  [TYPES.BLOB_STRING]: Buffer
}).hGetAll('key'); // Map<string, Buffer>
```

# `Multi.exec<'typed'>`

```javascript
client.multi()
  .ping()
  .exec(); // Array<ReplyUnion>

client.multi()
  .ping()
  .exec<'typed'>(); // [string]
```

# Request & Reply Policies

see [here](../docs/clustering.md#command-routing).
