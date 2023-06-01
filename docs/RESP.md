# RESP2 -> JS

- Integer (`:`) => `number`
- Simple String (`+`) => `string | Buffer`
- Blob String (`$`) => `string | Buffer`
- Simple Error (`-`) => `ErrorReply`
- Array (`*`) => `Array`

# RESP3 -> JS

- Null (`_`) => `null`
- Boolean (`#`) => `boolean`
- Number (`:`) => `number | string`
- Big Number (`(`) => `BigInt | string`
- Double (`,`) => `number | string`
- Simple String (`+`) => `string | Buffer`
- Blob String (`$`) => `string | Buffer`
- Verbatim String (`=`) => `string | Buffer | VerbatimString` (TODO: `VerbatimString` typedoc link)
- Simple Error (`-`) => `ErrorReply`
- Blob Error (`!`) => `ErrorReply`
- Array (`*`) => `Array`
- Set (`~`) => `Array | Set`
- Map (`%`) => `object | Map | Array`
- Push (`>`) => `Array` => PubSub push/`'push'` event

> NOTE: the first type is the default type

## Map keys and Set members

When decoding Map to `Map | object` or Set to `Set`, keys/members (respectively) of type "Simple String" or "Blob String" will be decoded as `string`s (ignoring flags) to allow lookup by type. If you need them as `Buffer`s, make sure to decode `Map`s/`Set`s as `Array`s.

## Not Implemented

These parts of RESP3 are not yet implemented in Redis itself (at the time of writing), so are not yet implemented in the Node-Redis client either:

- [Attribute type](https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md#attribute-type)
- [Streamed strings](https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md#streamed-strings)
- [Streamed aggregated data types](https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md#streamed-aggregated-data-types)
