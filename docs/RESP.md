# Mapping RESP types

RESP, which stands for **R**edis **SE**rialization **P**rotocol, is the protocol used by Redis to communicate with clients. This document shows how RESP types can be mapped to JavaScript types. You can learn more about RESP itself in the [offical documentation](https://redis.io/docs/reference/protocol-spec/).

By default, each type is mapped to the first option in the lists below. To change this, configure a [`typeMapping`](.).

## RESP2

- Integer (`:`) => `number`
- Simple String (`+`) => `string | Buffer`
- Blob String (`$`) => `string | Buffer`
- Simple Error (`-`) => `ErrorReply`
- Array (`*`) => `Array`

> NOTE: the first type is the default type

## RESP3

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

### Map keys and Set members

When decoding a Map to `Map | object` or a Set to `Set`, keys and members of type "Simple String" or "Blob String" will be decoded as `string`s which enables lookups by value, ignoring type mapping. If you want them as `Buffer`s, decode them as `Array`s instead.

### Not Implemented

These parts of RESP3 are not yet implemented in Redis itself (at the time of writing), so are not yet implemented in the Node-Redis client either:

- [Attribute type](https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md#attribute-type)
- [Streamed strings](https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md#streamed-strings)
- [Streamed aggregated data types](https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md#streamed-aggregated-data-types)
