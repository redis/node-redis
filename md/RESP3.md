# RESP3 => JS type mapping:

- Null (`_`) => `null`
- Boolean (`#`) => `boolean`
- Number (`:`) => `number | string`
- Big Number (`(`) => `BigInt | string`
- Double (`,`) => `number | string`
- Simple String (`+`) => `string | Buffer`
- Blob String (`$`) => `string | Buffer`
- Verbatim String (`=`) => `string | Buffer | VerbatimString`
- Simple Error (`-`) => `ErrorReply`
- Blob Error (`!`) => `ErrorReply`
- Array (`*`) => `Array`
- Set (`~`) => `Array | Set`
- Map (`%`) => `object | Map | Array`
- Push (`>`) => `Array` => PubSub push/`'push'` event

> NOTE: the first type is the default type

## Verbatim String

## Map keys and Set members

When decoding Map to `Map | object` or Set to `Set`, keys/members of type "Simple String" or "Blob String" will be decode as `string`s (ignoring flags) to allow lookup by type. If you need them as `Buffer`s, make sure to decode `Map`s/`Set`s as `Array`s.

## Not Implemented

These parts of RESP3 are not implemented in Redis itself (at the time of writing this), so we did not implemented them in the client as well:

- [Attribute type](https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md#attribute-type)
- [Streamed strings](https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md#streamed-strings)
- [Streamed aggregated data types](https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md#streamed-aggregated-data-types)
