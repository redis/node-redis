# v5 to v6 migration guide

## RESP3 is now the default protocol

In v5, Node-Redis defaulted to `RESP: 2` unless you explicitly configured `RESP: 3`.
In v6, the default is now `RESP: 3`. 

RESP3 introduces a bunch of “on the wire” formats that replace RESP2 workarounds.
Node-Redis already maps most of the RESP2 workarounds to the proper javascript type, but there are some commands that were missed.
Those are now aligned to return the proper types. For more details on protocol type mapping, see [RESP type mapping](./RESP.md).


## Default behavior changes (v5 default -> v6 default)

  - `GEOSEARCH_WITH`, `GEORADIUS_WITH`, `GEORADIUS_RO_WITH`, `GEORADIUSBYMEMBER_WITH`, `GEORADIUSBYMEMBER_RO_WITH` - `distance`, `coordinates.longitude`, and `coordinates.latitude` are now `number` (previously `string`).
  - `CF.INSERTNX` changed from `Array<boolean>` to `Array<number>`.


## Stabilized APIs
In v5, some command transforms were unstable under RESP3. In v6, those commands are stabilized and normalized:
These stabilization changes are RESP3-only: RESP2 transforms are unchanged.
They are breaking only for clients using RESP3 (including v5 users who explicitly opted into RESP3, and v6 users on the new default RESP3).

| Package | Command | Return type change | Notes |
|---|---|---|---|
| `@redis/client` | `HOTKEYS GET` | `ReplyUnion -> HotkeysGetReply \| null` | RESP3 reply now normalized to stable structured output. |
| `@redis/client` | `XREAD` | `ReplyUnion -> StreamsMessagesReply \| null` | RESP3 reply is normalized to v4/v5-compatible stream list shape. |
| `@redis/client` | `XREADGROUP` | `ReplyUnion -> StreamsMessagesReply \| null` | RESP3 reply is normalized to v4/v5-compatible stream list shape. |
| `@redis/search` | `FT.AGGREGATE` | `ReplyUnion -> AggregateReply` | RESP3 map/array variants normalized to aggregate reply shape. |
| `@redis/search` | `FT.AGGREGATE WITHCURSOR` | `ReplyUnion -> AggregateWithCursorReply` | Cursor + results are normalized for RESP3. |
| `@redis/search` | `FT.CURSOR READ` | `ReplyUnion -> AggregateWithCursorReply` | RESP3 cursor-read map/array wrapper variants are normalized to a stable `{ total, results, cursor }` reply shape. |
| `@redis/search` | `FT.SEARCH` | `ReplyUnion -> SearchReply` | RESP3 map-like payload normalized to `{ total, documents }`. |
| `@redis/search` | `FT.SEARCH NOCONTENT` | `ReplyUnion -> SearchNoContentReply` | RESP3 normalized through `FT.SEARCH` then projected to ids. |
| `@redis/search` | `FT.SPELLCHECK` | `ReplyUnion -> SpellCheckReply` | RESP3 result/suggestion map variants normalized. |
| `@redis/search` | `FT.HYBRID` | `ReplyUnion -> HybridSearchResult` | RESP3 map-like payload normalized to hybrid result object. |
| `@redis/search` | `FT.INFO` | `ReplyUnion -> InfoReply` | RESP3 map-like payload normalized to stable info object shape. |
| `@redis/search` | `FT.PROFILE SEARCH` | `ReplyUnion -> ProfileReplyResp2` | RESP3 profile/results wrappers normalized (Redis 7.4/8 layouts). |
| `@redis/search` | `FT.PROFILE AGGREGATE` | `ReplyUnion -> ProfileReplyResp2` | RESP3 profile/results wrappers normalized (Redis 7.4/8 layouts). |
| `@redis/time-series` | `TS.INFO` | `ReplyUnion -> InfoReply` | RESP3 map/array variants normalized to `InfoReply`. |
| `@redis/time-series` | `TS.INFO DEBUG` | `ReplyUnion -> InfoDebugReply` | RESP3 `keySelfName`/`chunks` payload normalized. |
| `@redis/time-series` | `TS.MRANGE GROUPBY` | `{ sources: Array<string>; samples: Array<{ timestamp: number; value: number }> } -> { samples: Array<{ timestamp: number; value: number }> }` | `sources` removed from RESP3 grouped reply. |
| `@redis/time-series` | `TS.MREVRANGE GROUPBY` | `{ sources: Array<string>; samples: Array<{ timestamp: number; value: number }> } -> { samples: Array<{ timestamp: number; value: number }> }` | In RESP3 grouped reverse-range replies, `sources` is removed and output now includes only `{ samples }`. |
| `@redis/time-series` | `TS.MRANGE SELECTED_LABELS GROUPBY` | `{ labels: Record<string, string \| null>; sources: Array<string>; samples: Array<{ timestamp: number; value: number }> } -> { labels: Record<string, string \| null>; samples: Array<{ timestamp: number; value: number }> }` | `sources` removed from RESP3 selected-labels grouped reply. |
| `@redis/time-series` | `TS.MREVRANGE SELECTED_LABELS GROUPBY` | `{ labels: Record<string, string \| null>; sources: Array<string>; samples: Array<{ timestamp: number; value: number }> } -> { labels: Record<string, string \| null>; samples: Array<{ timestamp: number; value: number }> }` | In RESP3 selected-labels grouped reverse-range replies, `sources` is removed and output now includes `{ labels, samples }`. |

## Object Prototype Normalization
In v6, object-like replies are normalized to plain objects (`{}` / `Object.defineProperties({}, ...)`) instead of null-prototype objects (`Object.create(null)`).

Compatibility impact: this can be technically breaking for code/tests that assert a `null` prototype (for example `Object.getPrototypeOf(reply) === null` or deep-equality against `Object.create(null)`), but for most users key access/iteration/serialization behavior remains the same.

Commands affected:

- `@redis/client`: `CONFIG GET`, `FUNCTION STATS`, `HGETALL`, `LATENCY HISTOGRAM` (`histogram_usec`), `PUBSUB NUMSUB`, `PUBSUB SHARDNUMSUB`, `VINFO`, `VLINKS WITHSCORES`, `XINFO STREAM` (entry message objects), `XREAD`/`XREADGROUP` (message objects)
- `@redis/search`: `FT.AGGREGATE`, `FT.AGGREGATE WITHCURSOR`, `FT.CURSOR READ`, `FT.CONFIG GET`, `FT.HYBRID`, `FT.INFO`, `FT.SEARCH`, `FT.PROFILE SEARCH`, `FT.PROFILE AGGREGATE`
- `@redis/time-series`: `TS.MGET`, `TS.MGET WITHLABELS`, `TS.MGET SELECTED_LABELS`, `TS.MRANGE`, `TS.MREVRANGE`, `TS.MRANGE GROUPBY`, `TS.MREVRANGE GROUPBY`, `TS.MRANGE WITHLABELS`, `TS.MREVRANGE WITHLABELS`, `TS.MRANGE WITHLABELS GROUPBY`, `TS.MREVRANGE WITHLABELS GROUPBY`, `TS.MRANGE SELECTED_LABELS`, `TS.MREVRANGE SELECTED_LABELS`, `TS.MRANGE SELECTED_LABELS GROUPBY`, `TS.MREVRANGE SELECTED_LABELS GROUPBY`
- `@redis/bloom`: `BF.INFO`, `CF.INFO`, `CMS.INFO`, `TOPK.INFO`, `TDIGEST.INFO`

Additionally, RESP3 map decoding now creates plain objects by default, so commands that expose raw RESP3 maps as JS objects inherit the same prototype change.



## If you need to preserve v5 default behavior while migrating, pin RESP2 explicitly:

```javascript
// Single node
const client = createClient({ RESP: 2 });

// Cluster
const cluster = createCluster({ RESP: 2, ...});

// Sentinel
const sentinel = createSentinel({ RESP: 2, ... });

// Pool
const pool = createClientPool({ RESP: 2 });
```
