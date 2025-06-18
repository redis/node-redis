<!-- Scanned 546 defs | resolved 546 | unknown 0 | discrepancies 182 -->

## BUG_WRITE_AS_RO (34)

we mark IS_READ_ONLY but server flags `write` (cluster would route to a replica)

| Command | Ours IS_READ_ONLY | Server readonly | Server flags | File |
| --- | --- | --- | --- | --- |
| `FT.ALIASADD` | true | false | write, denyoom, module | `packages/search/lib/commands/ALIASADD.ts` |
| `FT.ALIASDEL` | true | false | write, module | `packages/search/lib/commands/ALIASDEL.ts` |
| `FT.ALIASUPDATE` | true | false | write, denyoom, module | `packages/search/lib/commands/ALIASUPDATE.ts` |
| `FT.ALTER` | true | false | write, denyoom, module | `packages/search/lib/commands/ALTER.ts` |
| `FT.CONFIG\|SET` | true | false | write, module | `packages/search/lib/commands/CONFIG_SET.ts` |
| `FT.CREATE` | true | false | write, denyoom, module | `packages/search/lib/commands/CREATE.ts` |
| `FT.DICTADD` | true | false | write, denyoom, module | `packages/search/lib/commands/DICTADD.ts` |
| `FT.DICTDEL` | true | false | write, module | `packages/search/lib/commands/DICTDEL.ts` |
| `FT.DROPINDEX` | true | false | write, module | `packages/search/lib/commands/DROPINDEX.ts` |
| `FT.SUGADD` | true | false | write, denyoom, module | `packages/search/lib/commands/SUGADD.ts` |
| `FT.SUGDEL` | true | false | write, module | `packages/search/lib/commands/SUGDEL.ts` |
| `FT.SYNUPDATE` | true | false | write, denyoom, module | `packages/search/lib/commands/SYNUPDATE.ts` |
| `blpop` | true | false | write, blocking | `packages/client/lib/commands/BLPOP.ts` |
| `brpop` | true | false | write, blocking | `packages/client/lib/commands/BRPOP.ts` |
| `getdel` | true | false | write, fast | `packages/client/lib/commands/GETDEL.ts` |
| `getex` | true | false | write, fast | `packages/client/lib/commands/GETEX.ts` |
| `getset` | true | false | write, denyoom, fast | `packages/client/lib/commands/GETSET.ts` |
| `hpexpireat` | true | false | write, fast | `packages/client/lib/commands/HPEXPIREAT.ts` |
| `hsetnx` | true | false | write, denyoom, fast | `packages/client/lib/commands/HSETNX.ts` |
| `linsert` | true | false | write, denyoom | `packages/client/lib/commands/LINSERT.ts` |
| `lrem` | true | false | write | `packages/client/lib/commands/LREM.ts` |
| `lset` | true | false | write, denyoom | `packages/client/lib/commands/LSET.ts` |
| `mset` | true | false | write, denyoom | `packages/client/lib/commands/MSET.ts` |
| `msetnx` | true | false | write, denyoom | `packages/client/lib/commands/MSETNX.ts` |
| `pexpire` | true | false | write, fast | `packages/client/lib/commands/PEXPIRE.ts` |
| `pexpireat` | true | false | write, fast | `packages/client/lib/commands/PEXPIREAT.ts` |
| `pfadd` | true | false | write, denyoom, fast | `packages/client/lib/commands/PFADD.ts` |
| `rename` | true | false | write | `packages/client/lib/commands/RENAME.ts` |
| `renamenx` | true | false | write, fast | `packages/client/lib/commands/RENAMENX.ts` |
| `restore-asking` | true | false | write, denyoom, asking | `packages/client/lib/commands/RESTORE-ASKING.ts` |
| `sort` | true | false | write, denyoom, movablekeys | `packages/client/lib/commands/SORT.ts` |
| `xreadgroup` | true | false | write, blocking, movablekeys | `packages/client/lib/commands/XREADGROUP.ts` |
| `zdiffstore` | true | false | write, denyoom, movablekeys | `packages/client/lib/commands/ZDIFFSTORE.ts` |
| `bf.reserve` | true | false | write, denyoom, module | `packages/bloom/lib/commands/bloom/RESERVE.ts` |

## MISSED_RO (44)

we do not mark IS_READ_ONLY but server flags `readonly` (lost replica routing)

| Command | Ours IS_READ_ONLY | Server readonly | Server flags | File |
| --- | --- | --- | --- | --- |
| `ts.info` | false | true | readonly, module | `packages/time-series/lib/commands/INFO_DEBUG.ts` |
| `ts.mrevrange` | false | true | readonly, module | `packages/time-series/lib/commands/MREVRANGE.ts` |
| `ts.mrevrange` | false | true | readonly, module | `packages/time-series/lib/commands/MREVRANGE_GROUPBY.ts` |
| `ts.mrevrange` | false | true | readonly, module | `packages/time-series/lib/commands/MREVRANGE_MULTIAGGR.ts` |
| `ts.mrevrange` | false | true | readonly, module | `packages/time-series/lib/commands/MREVRANGE_SELECTED_LABELS.ts` |
| `ts.mrevrange` | false | true | readonly, module | `packages/time-series/lib/commands/MREVRANGE_SELECTED_LABELS_GROUPBY.ts` |
| `ts.mrevrange` | false | true | readonly, module | `packages/time-series/lib/commands/MREVRANGE_SELECTED_LABELS_MULTIAGGR.ts` |
| `ts.mrevrange` | false | true | readonly, module | `packages/time-series/lib/commands/MREVRANGE_WITHLABELS.ts` |
| `ts.mrevrange` | false | true | readonly, module | `packages/time-series/lib/commands/MREVRANGE_WITHLABELS_GROUPBY.ts` |
| `ts.mrevrange` | false | true | readonly, module | `packages/time-series/lib/commands/MREVRANGE_WITHLABELS_MULTIAGGR.ts` |
| `ts.revrange` | false | true | readonly, module | `packages/time-series/lib/commands/REVRANGE.ts` |
| `ts.revrange` | false | true | readonly, module | `packages/time-series/lib/commands/REVRANGE_MULTIAGGR.ts` |
| `FT.AGGREGATE` | false | true | readonly, module | `packages/search/lib/commands/AGGREGATE.ts` |
| `FT.AGGREGATE` | false | true | readonly, module | `packages/search/lib/commands/AGGREGATE_WITHCURSOR.ts` |
| `FT.SEARCH` | false | true | readonly, module | `packages/search/lib/commands/SEARCH_NOCONTENT.ts` |
| `FT.SUGGET` | false | true | readonly, module | `packages/search/lib/commands/SUGGET_WITHPAYLOADS.ts` |
| `FT.SUGGET` | false | true | readonly, module | `packages/search/lib/commands/SUGGET_WITHSCORES.ts` |
| `FT.SUGGET` | false | true | readonly, module | `packages/search/lib/commands/SUGGET_WITHSCORES_WITHPAYLOADS.ts` |
| `json.debug` | false | true | readonly, module | `packages/json/lib/commands/DEBUG_MEMORY.ts` |
| `json.get` | false | true | readonly, module | `packages/json/lib/commands/GET.ts` |
| `json.objkeys` | false | true | readonly, module | `packages/json/lib/commands/OBJKEYS.ts` |
| `fcall_ro` | false | true | readonly, noscript, stale, skip_monitor, no_mandatory_keys, movablekeys | `packages/client/lib/commands/FCALL_RO.ts` |
| `geosearch` | false | true | readonly | `packages/client/lib/commands/GEOSEARCH_WITH.ts` |
| `lcs` | false | true | readonly | `packages/client/lib/commands/LCS_IDX.ts` |
| `lcs` | false | true | readonly | `packages/client/lib/commands/LCS_IDX_WITHMATCHLEN.ts` |
| `lcs` | false | true | readonly | `packages/client/lib/commands/LCS_LEN.ts` |
| `lpos` | false | true | readonly | `packages/client/lib/commands/LPOS_COUNT.ts` |
| `srandmember` | false | true | readonly | `packages/client/lib/commands/SRANDMEMBER_COUNT.ts` |
| `touch` | false | true | readonly, fast | `packages/client/lib/commands/TOUCH.ts` |
| `VLINKS` | false | true | readonly, module, fast | `packages/client/lib/commands/VLINKS_WITHSCORES.ts` |
| `VSIM` | false | true | readonly, module | `packages/client/lib/commands/VSIM_WITHSCORES.ts` |
| `xrevrange` | false | true | readonly | `packages/client/lib/commands/XREVRANGE.ts` |
| `zdiff` | false | true | readonly, movablekeys | `packages/client/lib/commands/ZDIFF_WITHSCORES.ts` |
| `zinter` | false | true | readonly, movablekeys | `packages/client/lib/commands/ZINTER_WITHSCORES.ts` |
| `zrandmember` | false | true | readonly | `packages/client/lib/commands/ZRANDMEMBER_COUNT.ts` |
| `zrandmember` | false | true | readonly | `packages/client/lib/commands/ZRANDMEMBER_COUNT_WITHSCORES.ts` |
| `zrangebyscore` | false | true | readonly | `packages/client/lib/commands/ZRANGEBYSCORE_WITHSCORES.ts` |
| `zrange` | false | true | readonly | `packages/client/lib/commands/ZRANGE_WITHSCORES.ts` |
| `zrank` | false | true | readonly, fast | `packages/client/lib/commands/ZRANK_WITHSCORE.ts` |
| `zunion` | false | true | readonly, movablekeys | `packages/client/lib/commands/ZUNION_WITHSCORES.ts` |
| `topk.query` | false | true | readonly, module | `packages/bloom/lib/commands/top-k/QUERY.ts` |
| `tdigest.byrevrank` | false | true | readonly, module | `packages/bloom/lib/commands/t-digest/BYREVRANK.ts` |
| `tdigest.revrank` | false | true | readonly, module | `packages/bloom/lib/commands/t-digest/REVRANK.ts` |
| `cf.exists` | false | true | readonly, module, fast | `packages/bloom/lib/commands/cuckoo/EXISTS.ts` |

## NOISE (104)

server has neither `readonly` nor `write` (admin/conn/pubsub/cluster) — likely by-design

| Command | Ours IS_READ_ONLY | Server readonly | Server flags | RO ok? | Why | File |
| --- | --- | --- | --- | --- | --- | --- |
| `acl\|cat` | true | false | noscript, loading, stale | Yes | reads static ACL categories | `packages/client/lib/commands/ACL_CAT.ts` |
| `acl\|deluser` | true | false | admin, noscript, loading, stale | No | mutates ACL | `packages/client/lib/commands/ACL_DELUSER.ts` |
| `acl\|dryrun` | true | false | admin, noscript, loading, stale | Yes | simulates, no mutation | `packages/client/lib/commands/ACL_DRYRUN.ts` |
| `acl\|genpass` | true | false | noscript, loading, stale | Yes | pure RNG, node-local | `packages/client/lib/commands/ACL_GENPASS.ts` |
| `acl\|getuser` | true | false | admin, noscript, loading, stale | Yes | reads ACL | `packages/client/lib/commands/ACL_GETUSER.ts` |
| `acl\|list` | true | false | admin, noscript, loading, stale | Yes | reads ACL | `packages/client/lib/commands/ACL_LIST.ts` |
| `acl\|load` | true | false | admin, noscript, loading, stale | No | reloads ACL from file | `packages/client/lib/commands/ACL_LOAD.ts` |
| `acl\|log` | true | false | admin, noscript, loading, stale | Yes | reads ACL security log | `packages/client/lib/commands/ACL_LOG.ts` |
| `acl\|save` | true | false | admin, noscript, loading, stale | No | writes ACL to file | `packages/client/lib/commands/ACL_SAVE.ts` |
| `acl\|setuser` | true | false | admin, noscript, loading, stale | No | mutates ACL | `packages/client/lib/commands/ACL_SETUSER.ts` |
| `acl\|users` | true | false | admin, noscript, loading, stale | Yes | reads ACL | `packages/client/lib/commands/ACL_USERS.ts` |
| `acl\|whoami` | true | false | noscript, loading, stale | Yes | connection identity read | `packages/client/lib/commands/ACL_WHOAMI.ts` |
| `asking` | true | false | fast | Yes | connection-local cluster redirect marker | `packages/client/lib/commands/ASKING.ts` |
| `auth` | true | false | noscript, loading, stale, fast, no_auth, allow_busy | Yes | connection-local auth | `packages/client/lib/commands/AUTH.ts` |
| `bgrewriteaof` | true | false | admin, noscript, no_async_loading | No | triggers AOF rewrite on the node | `packages/client/lib/commands/BGREWRITEAOF.ts` |
| `bgsave` | true | false | admin, noscript, no_async_loading | No | triggers RDB save on the node | `packages/client/lib/commands/BGSAVE.ts` |
| `client\|caching` | true | false | noscript, loading, stale | Yes | connection-local tracking toggle | `packages/client/lib/commands/CLIENT_CACHING.ts` |
| `client\|getname` | true | false | noscript, loading, stale | Yes | connection-local read | `packages/client/lib/commands/CLIENT_GETNAME.ts` |
| `client\|getredir` | true | false | noscript, loading, stale | Yes | connection-local read | `packages/client/lib/commands/CLIENT_GETREDIR.ts` |
| `client\|id` | true | false | noscript, loading, stale | Yes | connection-local read | `packages/client/lib/commands/CLIENT_ID.ts` |
| `client\|info` | true | false | noscript, loading, stale | Yes | connection-local read | `packages/client/lib/commands/CLIENT_INFO.ts` |
| `client\|kill` | true | false | admin, noscript, loading, stale | No | mutates other connections (admin) | `packages/client/lib/commands/CLIENT_KILL.ts` |
| `client\|list` | true | false | admin, noscript, loading, stale | Yes | reads connections (per-node view) | `packages/client/lib/commands/CLIENT_LIST.ts` |
| `client\|no-evict` | true | false | admin, noscript, loading, stale | Yes | connection-local toggle | `packages/client/lib/commands/CLIENT_NO-EVICT.ts` |
| `client\|no-touch` | true | false | noscript, loading, stale | Yes | connection-local toggle | `packages/client/lib/commands/CLIENT_NO-TOUCH.ts` |
| `client\|pause` | true | false | admin, noscript, loading, stale | No | pauses command processing (server state) | `packages/client/lib/commands/CLIENT_PAUSE.ts` |
| `client\|setname` | true | false | noscript, loading, stale | Yes | sets own connection name | `packages/client/lib/commands/CLIENT_SETNAME.ts` |
| `client\|tracking` | true | false | noscript, loading, stale | Yes | connection-local toggle | `packages/client/lib/commands/CLIENT_TRACKING.ts` |
| `client\|trackinginfo` | true | false | noscript, loading, stale | Yes | connection-local read | `packages/client/lib/commands/CLIENT_TRACKINGINFO.ts` |
| `client\|unblock` | true | false | admin, noscript, loading, stale | No | mutates another client (admin) | `packages/client/lib/commands/CLIENT_UNBLOCK.ts` |
| `client\|unpause` | true | false | admin, noscript, loading, stale | No | resumes command processing (server state) | `packages/client/lib/commands/CLIENT_UNPAUSE.ts` |
| `cluster\|addslots` | true | false | admin, stale, no_async_loading | No | mutates slot map | `packages/client/lib/commands/CLUSTER_ADDSLOTS.ts` |
| `cluster\|addslotsrange` | true | false | admin, stale, no_async_loading | No | mutates slot map | `packages/client/lib/commands/CLUSTER_ADDSLOTSRANGE.ts` |
| `cluster\|bumpepoch` | true | false | admin, stale, no_async_loading | No | mutates cluster epoch | `packages/client/lib/commands/CLUSTER_BUMPEPOCH.ts` |
| `cluster\|count-failure-reports` | true | false | admin, loading, stale | Yes | reads failure reports | `packages/client/lib/commands/CLUSTER_COUNT-FAILURE-REPORTS.ts` |
| `cluster\|countkeysinslot` | true | false | stale | Yes | reads (per-node) | `packages/client/lib/commands/CLUSTER_COUNTKEYSINSLOT.ts` |
| `cluster\|delslots` | true | false | admin, stale, no_async_loading | No | mutates slot map | `packages/client/lib/commands/CLUSTER_DELSLOTS.ts` |
| `cluster\|delslotsrange` | true | false | admin, stale, no_async_loading | No | mutates slot map | `packages/client/lib/commands/CLUSTER_DELSLOTSRANGE.ts` |
| `cluster\|failover` | true | false | admin, stale, no_async_loading | No | triggers failover | `packages/client/lib/commands/CLUSTER_FAILOVER.ts` |
| `cluster\|flushslots` | true | false | admin, stale, no_async_loading | No | mutates slot map | `packages/client/lib/commands/CLUSTER_FLUSHSLOTS.ts` |
| `cluster\|forget` | true | false | admin, stale, no_async_loading | No | mutates node set | `packages/client/lib/commands/CLUSTER_FORGET.ts` |
| `cluster\|getkeysinslot` | true | false | stale | Yes | reads keys in slot (per-node) | `packages/client/lib/commands/CLUSTER_GETKEYSINSLOT.ts` |
| `cluster\|info` | true | false | loading, stale | Yes | reads cluster state | `packages/client/lib/commands/CLUSTER_INFO.ts` |
| `cluster\|keyslot` | true | false | loading, stale | Yes | pure hash computation | `packages/client/lib/commands/CLUSTER_KEYSLOT.ts` |
| `cluster\|links` | true | false | loading, stale | Yes | reads links | `packages/client/lib/commands/CLUSTER_LINKS.ts` |
| `cluster\|meet` | true | false | admin, stale, no_async_loading | No | mutates node set | `packages/client/lib/commands/CLUSTER_MEET.ts` |
| `cluster\|myid` | true | false | loading, stale | Yes | reads node id | `packages/client/lib/commands/CLUSTER_MYID.ts` |
| `cluster\|myshardid` | true | false | loading, stale | Yes | reads shard id | `packages/client/lib/commands/CLUSTER_MYSHARDID.ts` |
| `cluster\|nodes` | true | false | loading, stale | Yes | reads topology (per-node view) | `packages/client/lib/commands/CLUSTER_NODES.ts` |
| `cluster\|replicas` | true | false | admin, loading, stale | Yes | reads replicas | `packages/client/lib/commands/CLUSTER_REPLICAS.ts` |
| `cluster\|replicate` | true | false | admin, stale, no_async_loading | No | changes replication target | `packages/client/lib/commands/CLUSTER_REPLICATE.ts` |
| `cluster\|reset` | true | false | admin, noscript, stale | No | resets cluster node | `packages/client/lib/commands/CLUSTER_RESET.ts` |
| `cluster\|saveconfig` | true | false | admin, stale, no_async_loading | No | writes nodes.conf | `packages/client/lib/commands/CLUSTER_SAVECONFIG.ts` |
| `cluster\|set-config-epoch` | true | false | admin, stale, no_async_loading | No | mutates epoch | `packages/client/lib/commands/CLUSTER_SET-CONFIG-EPOCH.ts` |
| `cluster\|setslot` | true | false | admin, stale, no_async_loading | No | mutates slot map | `packages/client/lib/commands/CLUSTER_SETSLOT.ts` |
| `cluster\|slots` | true | false | loading, stale | Yes | reads slot map | `packages/client/lib/commands/CLUSTER_SLOTS.ts` |
| `command` | true | false | loading, stale | Yes | static command metadata, node-local | `packages/client/lib/commands/COMMAND.ts` |
| `command\|count` | true | false | loading, stale | Yes | static metadata | `packages/client/lib/commands/COMMAND_COUNT.ts` |
| `command\|getkeys` | true | false | loading, stale | Yes | pure arg parse | `packages/client/lib/commands/COMMAND_GETKEYS.ts` |
| `command\|getkeysandflags` | true | false | loading, stale | Yes | pure arg parse | `packages/client/lib/commands/COMMAND_GETKEYSANDFLAGS.ts` |
| `command\|info` | true | false | loading, stale | Yes | static metadata | `packages/client/lib/commands/COMMAND_INFO.ts` |
| `command\|list` | true | false | loading, stale | Yes | static metadata | `packages/client/lib/commands/COMMAND_LIST.ts` |
| `config\|get` | true | false | admin, noscript, loading, stale | Yes | reads config (per-node) | `packages/client/lib/commands/CONFIG_GET.ts` |
| `config\|resetstat` | true | false | admin, noscript, loading, stale | No | resets stats counters | `packages/client/lib/commands/CONFIG_RESETSTAT.ts` |
| `config\|rewrite` | true | false | admin, noscript, loading, stale | No | writes config file | `packages/client/lib/commands/CONFIG_REWRITE.ts` |
| `config\|set` | true | false | admin, noscript, loading, stale | No | mutates config | `packages/client/lib/commands/CONFIG_SET.ts` |
| `echo` | true | false | loading, stale, fast | Yes | node-local no-op | `packages/client/lib/commands/ECHO.ts` |
| `function\|dump` | true | false | noscript | Yes | reads function payload | `packages/client/lib/commands/FUNCTION_DUMP.ts` |
| `function\|kill` | true | false | noscript, allow_busy | No | kills running function | `packages/client/lib/commands/FUNCTION_KILL.ts` |
| `function\|stats` | true | false | noscript, allow_busy | Yes | reads runtime (per-node) | `packages/client/lib/commands/FUNCTION_STATS.ts` |
| `hotkeys\|get` | true | false | admin, noscript | Yes | reads hotkey stats | `packages/client/lib/commands/HOTKEYS_GET.ts` |
| `info` | true | false | loading, stale | Yes | reads server stats (per-node) | `packages/client/lib/commands/INFO.ts` |
| `lastsave` | true | false | loading, stale, fast | Yes | reads last-save time (per-node) | `packages/client/lib/commands/LASTSAVE.ts` |
| `latency\|doctor` | true | false | admin, noscript, loading, stale | Yes | reads latency report | `packages/client/lib/commands/LATENCY_DOCTOR.ts` |
| `latency\|graph` | true | false | admin, noscript, loading, stale | Yes | reads latency graph | `packages/client/lib/commands/LATENCY_GRAPH.ts` |
| `latency\|histogram` | true | false | admin, noscript, loading, stale | Yes | reads latency histogram | `packages/client/lib/commands/LATENCY_HISTOGRAM.ts` |
| `latency\|history` | true | false | admin, noscript, loading, stale | Yes | reads latency history | `packages/client/lib/commands/LATENCY_HISTORY.ts` |
| `latency\|latest` | true | false | admin, noscript, loading, stale | Yes | reads latency samples | `packages/client/lib/commands/LATENCY_LATEST.ts` |
| `memory\|doctor` | true | false |  | Yes | reads memory report | `packages/client/lib/commands/MEMORY_DOCTOR.ts` |
| `memory\|malloc-stats` | true | false |  | Yes | reads allocator stats | `packages/client/lib/commands/MEMORY_MALLOC-STATS.ts` |
| `memory\|stats` | true | false |  | Yes | reads memory stats | `packages/client/lib/commands/MEMORY_STATS.ts` |
| `module\|list` | true | false | admin, noscript | Yes | reads loaded modules | `packages/client/lib/commands/MODULE_LIST.ts` |
| `module\|load` | true | false | admin, noscript, no_async_loading | No | loads module (server state) | `packages/client/lib/commands/MODULE_LOAD.ts` |
| `module\|unload` | true | false | admin, noscript, no_async_loading | No | unloads module (server state) | `packages/client/lib/commands/MODULE_UNLOAD.ts` |
| `ping` | true | false | fast | Yes | node-local no-op | `packages/client/lib/commands/PING.ts` |
| `publish` | true | false | pubsub, loading, stale, fast | Yes | keyless; propagates cluster-wide via bus | `packages/client/lib/commands/PUBLISH.ts` |
| `pubsub\|channels` | true | false | pubsub, loading, stale | Yes | reads pubsub state (per-node) | `packages/client/lib/commands/PUBSUB_CHANNELS.ts` |
| `pubsub\|numpat` | true | false | pubsub, loading, stale | Yes | reads pubsub state | `packages/client/lib/commands/PUBSUB_NUMPAT.ts` |
| `pubsub\|numsub` | true | false | pubsub, loading, stale | Yes | reads pubsub state | `packages/client/lib/commands/PUBSUB_NUMSUB.ts` |
| `pubsub\|shardchannels` | true | false | pubsub, loading, stale | Yes | reads shard pubsub state | `packages/client/lib/commands/PUBSUB_SHARDCHANNELS.ts` |
| `pubsub\|shardnumsub` | true | false | pubsub, loading, stale | Yes | reads shard pubsub state | `packages/client/lib/commands/PUBSUB_SHARDNUMSUB.ts` |
| `readonly` | true | false | loading, stale, fast | Yes | connection-local cluster mode toggle | `packages/client/lib/commands/READONLY.ts` |
| `readwrite` | true | false | loading, stale, fast | Yes | connection-local cluster mode toggle | `packages/client/lib/commands/READWRITE.ts` |
| `replicaof` | true | false | admin, noscript, stale, no_async_loading | No | changes replication topology | `packages/client/lib/commands/REPLICAOF.ts` |
| `role` | true | false | noscript, loading, stale, fast | Yes | reads role (per-node) | `packages/client/lib/commands/ROLE.ts` |
| `save` | true | false | admin, noscript, no_async_loading, no_multi | No | blocking RDB save | `packages/client/lib/commands/SAVE.ts` |
| `script\|debug` | true | false | noscript | Yes | connection-local debug toggle | `packages/client/lib/commands/SCRIPT_DEBUG.ts` |
| `script\|exists` | true | false | noscript | Yes | reads script cache (per-node) | `packages/client/lib/commands/SCRIPT_EXISTS.ts` |
| `script\|flush` | true | false | noscript | No | flushes script cache | `packages/client/lib/commands/SCRIPT_FLUSH.ts` |
| `script\|kill` | true | false | noscript, allow_busy | No | kills running script | `packages/client/lib/commands/SCRIPT_KILL.ts` |
| `script\|load` | true | false | noscript, stale | No | writes to node script cache; primary needed for EVALSHA | `packages/client/lib/commands/SCRIPT_LOAD.ts` |
| `spublish` | true | false | pubsub, loading, stale, fast | Yes | keyless; shard pubsub | `packages/client/lib/commands/SPUBLISH.ts` |
| `time` | true | false | loading, stale, fast | Yes | reads node clock, node-local | `packages/client/lib/commands/TIME.ts` |
| `wait` | true | false | blocking | No | waits for replica acks; must run on primary | `packages/client/lib/commands/WAIT.ts` |

