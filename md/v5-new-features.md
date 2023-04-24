# RESP3 Support

```javascript
const client = createClient({
  RESP: 3
});

client.on('error', err => console.error(err));

await client.connect();

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

We have introduced the ability to perform a 'typed' `MULTI`/`EXEC` transaction.  Rather than returning `Array<ReplyUnion>`, a transaction invoked with `.exec<'typed'>` will return types appropriate to the commands in the transaction where possible.  

Example:

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
