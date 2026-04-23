import type { RedisCommands } from '../RESP/types';
import ACL_CAT from './ACL_CAT';
import ACL_DELUSER from './ACL_DELUSER';
import ACL_DRYRUN from './ACL_DRYRUN';
import ACL_GENPASS from './ACL_GENPASS';
import ACL_GETUSER from './ACL_GETUSER';
import ACL_LIST from './ACL_LIST';
import ACL_LOAD from './ACL_LOAD';
import ACL_LOG_RESET from './ACL_LOG_RESET';
import ACL_LOG from './ACL_LOG';
import ACL_SAVE from './ACL_SAVE';
import ACL_SETUSER from './ACL_SETUSER';
import ACL_USERS from './ACL_USERS';
import ACL_WHOAMI from './ACL_WHOAMI';
import APPEND from './APPEND';
import ASKING from './ASKING';
import AUTH from './AUTH';
import BGREWRITEAOF from './BGREWRITEAOF';
import BGSAVE from './BGSAVE';
import BITCOUNT from './BITCOUNT';
import BITFIELD_RO from './BITFIELD_RO';
import BITFIELD from './BITFIELD';
import BITOP from './BITOP';
import BITPOS from './BITPOS';
import BLMOVE from './BLMOVE';
import BLMPOP from './BLMPOP';
import BLPOP from './BLPOP';
import BRPOP from './BRPOP';
import BRPOPLPUSH from './BRPOPLPUSH';
import BZMPOP from './BZMPOP';
import BZPOPMAX from './BZPOPMAX';
import BZPOPMIN from './BZPOPMIN';
import CLIENT_CACHING from './CLIENT_CACHING';
import CLIENT_GETNAME from './CLIENT_GETNAME';
import CLIENT_GETREDIR from './CLIENT_GETREDIR';
import CLIENT_ID from './CLIENT_ID';
import CLIENT_INFO from './CLIENT_INFO';
import CLIENT_KILL, { CLIENT_KILL_FILTERS } from './CLIENT_KILL';
import CLIENT_LIST from './CLIENT_LIST';
import CLIENT_NO_EVICT from './CLIENT_NO-EVICT';
import CLIENT_NO_TOUCH from './CLIENT_NO-TOUCH';
import CLIENT_PAUSE from './CLIENT_PAUSE';
import CLIENT_SETNAME from './CLIENT_SETNAME';
import CLIENT_TRACKING from './CLIENT_TRACKING';
import CLIENT_TRACKINGINFO from './CLIENT_TRACKINGINFO';
import CLIENT_UNPAUSE from './CLIENT_UNPAUSE';
import CLUSTER_ADDSLOTS from './CLUSTER_ADDSLOTS';
import CLUSTER_ADDSLOTSRANGE from './CLUSTER_ADDSLOTSRANGE';
import CLUSTER_BUMPEPOCH from './CLUSTER_BUMPEPOCH';
import CLUSTER_COUNT_FAILURE_REPORTS from './CLUSTER_COUNT-FAILURE-REPORTS';
import CLUSTER_COUNTKEYSINSLOT from './CLUSTER_COUNTKEYSINSLOT';
import CLUSTER_DELSLOTS from './CLUSTER_DELSLOTS';
import CLUSTER_DELSLOTSRANGE from './CLUSTER_DELSLOTSRANGE';
import CLUSTER_FAILOVER, { FAILOVER_MODES } from './CLUSTER_FAILOVER';
import CLUSTER_FLUSHSLOTS from './CLUSTER_FLUSHSLOTS';
import CLUSTER_FORGET from './CLUSTER_FORGET';
import CLUSTER_GETKEYSINSLOT from './CLUSTER_GETKEYSINSLOT';
import CLUSTER_INFO from './CLUSTER_INFO';
import CLUSTER_KEYSLOT from './CLUSTER_KEYSLOT';
import CLUSTER_LINKS from './CLUSTER_LINKS';
import CLUSTER_MEET from './CLUSTER_MEET';
import CLUSTER_MYID from './CLUSTER_MYID';
import CLUSTER_MYSHARDID from './CLUSTER_MYSHARDID';
import CLUSTER_NODES from './CLUSTER_NODES';
import CLUSTER_REPLICAS from './CLUSTER_REPLICAS';
import CLUSTER_REPLICATE from './CLUSTER_REPLICATE';
import CLUSTER_RESET from './CLUSTER_RESET';
import CLUSTER_SAVECONFIG from './CLUSTER_SAVECONFIG';
import CLUSTER_SET_CONFIG_EPOCH from './CLUSTER_SET-CONFIG-EPOCH';
import CLUSTER_SETSLOT, { CLUSTER_SLOT_STATES } from './CLUSTER_SETSLOT';
import CLUSTER_SLOTS from './CLUSTER_SLOTS';
import COMMAND_COUNT from './COMMAND_COUNT';
import COMMAND_GETKEYS from './COMMAND_GETKEYS';
import COMMAND_GETKEYSANDFLAGS from './COMMAND_GETKEYSANDFLAGS';
import COMMAND_INFO from './COMMAND_INFO';
import COMMAND_LIST, { COMMAND_LIST_FILTER_BY } from './COMMAND_LIST';
import COMMAND from './COMMAND';
import CONFIG_GET from './CONFIG_GET';
import CONFIG_RESETASTAT from './CONFIG_RESETSTAT';
import CONFIG_REWRITE from './CONFIG_REWRITE';
import CONFIG_SET from './CONFIG_SET';
import COPY from './COPY';
import DBSIZE from './DBSIZE';
import DECR from './DECR';
import DECRBY from './DECRBY';
import DEL from './DEL';
import DELEX from './DELEX';
import DIGEST from './DIGEST';
import DUMP from './DUMP';
import ECHO from './ECHO';
import EVAL_RO from './EVAL_RO';
import EVAL from './EVAL';
import EVALSHA_RO from './EVALSHA_RO';
import EVALSHA from './EVALSHA';
import GCRA from './GCRA';
import GEOADD from './GEOADD';
import GEODIST from './GEODIST';
import GEOHASH from './GEOHASH';
import GEOPOS from './GEOPOS';
import GEORADIUS_RO_WITH from './GEORADIUS_RO_WITH';
import GEORADIUS_RO from './GEORADIUS_RO';
import GEORADIUS_STORE from './GEORADIUS_STORE';
import GEORADIUS_WITH from './GEORADIUS_WITH';
import GEORADIUS from './GEORADIUS';
import GEORADIUSBYMEMBER_RO_WITH from './GEORADIUSBYMEMBER_RO_WITH';
import GEORADIUSBYMEMBER_RO from './GEORADIUSBYMEMBER_RO';
import GEORADIUSBYMEMBER_STORE from './GEORADIUSBYMEMBER_STORE';
import GEORADIUSBYMEMBER_WITH from './GEORADIUSBYMEMBER_WITH';
import GEORADIUSBYMEMBER from './GEORADIUSBYMEMBER';
import GEOSEARCH_WITH from './GEOSEARCH_WITH';
import GEOSEARCH from './GEOSEARCH';
import GEOSEARCHSTORE from './GEOSEARCHSTORE';
import GET from './GET';
import GETBIT from './GETBIT';
import GETDEL from './GETDEL';
import GETEX from './GETEX';
import GETRANGE from './GETRANGE';
import GETSET from './GETSET';
import EXISTS from './EXISTS';
import EXPIRE from './EXPIRE';
import EXPIREAT from './EXPIREAT';
import EXPIRETIME from './EXPIRETIME';
import FLUSHALL, { REDIS_FLUSH_MODES } from './FLUSHALL';
import FLUSHDB from './FLUSHDB';
import FCALL from './FCALL';
import FCALL_RO from './FCALL_RO';
import FUNCTION_DELETE from './FUNCTION_DELETE';
import FUNCTION_DUMP from './FUNCTION_DUMP';
import FUNCTION_FLUSH from './FUNCTION_FLUSH';
import FUNCTION_KILL from './FUNCTION_KILL';
import FUNCTION_LIST_WITHCODE from './FUNCTION_LIST_WITHCODE';
import FUNCTION_LIST from './FUNCTION_LIST';
import FUNCTION_LOAD from './FUNCTION_LOAD';
import FUNCTION_RESTORE from './FUNCTION_RESTORE';
import FUNCTION_STATS from './FUNCTION_STATS';
import HDEL from './HDEL';
import HELLO from './HELLO';
import HEXISTS from './HEXISTS';
import HEXPIRE from './HEXPIRE';
import HEXPIREAT from './HEXPIREAT';
import HEXPIRETIME from './HEXPIRETIME';
import HGET from './HGET';
import HGETALL from './HGETALL';
import HGETDEL from './HGETDEL';
import HGETEX from './HGETEX';
import HINCRBY from './HINCRBY';
import HINCRBYFLOAT from './HINCRBYFLOAT';
import HKEYS from './HKEYS';
import HLEN from './HLEN';
import HMGET from './HMGET';
import HPERSIST from './HPERSIST';
import HPEXPIRE from './HPEXPIRE';
import HPEXPIREAT from './HPEXPIREAT';
import HPEXPIRETIME from './HPEXPIRETIME';
import HPTTL from './HPTTL';
import HRANDFIELD_COUNT_WITHVALUES from './HRANDFIELD_COUNT_WITHVALUES';
import HRANDFIELD_COUNT from './HRANDFIELD_COUNT';
import HRANDFIELD from './HRANDFIELD';
import HSCAN from './HSCAN';
import HSCAN_NOVALUES from './HSCAN_NOVALUES';
import HSET from './HSET';
import HSETEX from './HSETEX';
import HSETNX from './HSETNX';
import HSTRLEN from './HSTRLEN';
import HTTL from './HTTL';
import HVALS from './HVALS';
import HOTKEYS_GET from './HOTKEYS_GET';
import HOTKEYS_RESET from './HOTKEYS_RESET';
import HOTKEYS_START from './HOTKEYS_START';
import HOTKEYS_STOP from './HOTKEYS_STOP';
import INCR from './INCR';
import INCRBY from './INCRBY';
import INCRBYFLOAT from './INCRBYFLOAT';
import INFO from './INFO';
import KEYS from './KEYS';
import LASTSAVE from './LASTSAVE';
import LATENCY_DOCTOR from './LATENCY_DOCTOR';
import LATENCY_GRAPH from './LATENCY_GRAPH';
import LATENCY_HISTORY from './LATENCY_HISTORY';
import LATENCY_LATEST from './LATENCY_LATEST';
import LATENCY_RESET from './LATENCY_RESET';
import LCS_IDX_WITHMATCHLEN from './LCS_IDX_WITHMATCHLEN';
import LCS_IDX from './LCS_IDX';
import LCS_LEN from './LCS_LEN';
import LCS from './LCS';
import LINDEX from './LINDEX';
import LINSERT from './LINSERT';
import LLEN from './LLEN';
import LMOVE from './LMOVE';
import LMPOP from './LMPOP';
import LOLWUT from './LOLWUT';
import LPOP_COUNT from './LPOP_COUNT';
import LPOP from './LPOP';
import LPOS_COUNT from './LPOS_COUNT';
import LPOS from './LPOS';
import LPUSH from './LPUSH';
import LPUSHX from './LPUSHX';
import LRANGE from './LRANGE';
import LREM from './LREM';
import LSET from './LSET';
import LTRIM from './LTRIM';
import MEMORY_DOCTOR from './MEMORY_DOCTOR';
import MEMORY_MALLOC_STATS from './MEMORY_MALLOC-STATS';
import MEMORY_PURGE from './MEMORY_PURGE';
import MEMORY_STATS from './MEMORY_STATS';
import MEMORY_USAGE from './MEMORY_USAGE';
import MGET from './MGET';
import MIGRATE from './MIGRATE';
import MODULE_LIST from './MODULE_LIST';
import MODULE_LOAD from './MODULE_LOAD';
import MODULE_UNLOAD from './MODULE_UNLOAD';
import MOVE from './MOVE';
import MSET from './MSET';
import MSETEX from './MSETEX';
import MSETNX from './MSETNX';
import OBJECT_ENCODING from './OBJECT_ENCODING';
import OBJECT_FREQ from './OBJECT_FREQ';
import OBJECT_IDLETIME from './OBJECT_IDLETIME';
import OBJECT_REFCOUNT from './OBJECT_REFCOUNT';
import PERSIST from './PERSIST';
import PEXPIRE from './PEXPIRE';
import PEXPIREAT from './PEXPIREAT';
import PEXPIRETIME from './PEXPIRETIME';
import PFADD from './PFADD';
import PFCOUNT from './PFCOUNT';
import PFMERGE from './PFMERGE';
import PING from './PING';
import PSETEX from './PSETEX';
import PTTL from './PTTL';
import PUBLISH from './PUBLISH';
import PUBSUB_CHANNELS from './PUBSUB_CHANNELS';
import PUBSUB_NUMPAT from './PUBSUB_NUMPAT';
import PUBSUB_NUMSUB from './PUBSUB_NUMSUB';
import PUBSUB_SHARDNUMSUB from './PUBSUB_SHARDNUMSUB';
import PUBSUB_SHARDCHANNELS from './PUBSUB_SHARDCHANNELS';
import RANDOMKEY from './RANDOMKEY';
import READONLY from './READONLY';
import RENAME from './RENAME';
import RENAMENX from './RENAMENX';
import REPLICAOF from './REPLICAOF';
import RESTORE_ASKING from './RESTORE-ASKING';
import RESTORE from './RESTORE';
import ROLE from './ROLE';
import RPOP_COUNT from './RPOP_COUNT';
import RPOP from './RPOP';
import RPOPLPUSH from './RPOPLPUSH';
import RPUSH from './RPUSH';
import RPUSHX from './RPUSHX';
import SADD from './SADD';
import SCAN from './SCAN';
import SCARD from './SCARD';
import SCRIPT_DEBUG from './SCRIPT_DEBUG';
import SCRIPT_EXISTS from './SCRIPT_EXISTS';
import SCRIPT_FLUSH from './SCRIPT_FLUSH';
import SCRIPT_KILL from './SCRIPT_KILL';
import SCRIPT_LOAD from './SCRIPT_LOAD';
import SDIFF from './SDIFF';
import SDIFFSTORE from './SDIFFSTORE';
import SET from './SET';
import SETBIT from './SETBIT';
import SETEX from './SETEX';
import SETNX from './SETNX';
import SETRANGE from './SETRANGE';
import SINTER from './SINTER';
import SINTERCARD from './SINTERCARD';
import SINTERSTORE from './SINTERSTORE';
import SISMEMBER from './SISMEMBER';
import SMEMBERS from './SMEMBERS';
import SMISMEMBER from './SMISMEMBER';
import SMOVE from './SMOVE';
import SORT_RO from './SORT_RO';
import SORT_STORE from './SORT_STORE';
import SORT from './SORT';
import SPOP_COUNT from './SPOP_COUNT';
import SPOP from './SPOP';
import SPUBLISH from './SPUBLISH';
import SRANDMEMBER_COUNT from './SRANDMEMBER_COUNT';
import SRANDMEMBER from './SRANDMEMBER';
import SREM from './SREM';
import SSCAN from './SSCAN';
import STRLEN from './STRLEN';
import SUNION from './SUNION';
import SUNIONSTORE from './SUNIONSTORE';
import SWAPDB from './SWAPDB';
import TIME from './TIME';
import TOUCH from './TOUCH';
import TTL from './TTL';
import TYPE from './TYPE';
import UNLINK from './UNLINK';
import WAIT from './WAIT';
import XACK from './XACK';
import XACKDEL from './XACKDEL';
import XADD_NOMKSTREAM from './XADD_NOMKSTREAM';
import XADD from './XADD';
import XAUTOCLAIM_JUSTID from './XAUTOCLAIM_JUSTID';
import XAUTOCLAIM from './XAUTOCLAIM';
import XCLAIM_JUSTID from './XCLAIM_JUSTID';
import XCLAIM from './XCLAIM';
import XCFGSET from './XCFGSET';
import XDEL from './XDEL';
import XDELEX from './XDELEX';
import XGROUP_CREATE from './XGROUP_CREATE';
import XGROUP_CREATECONSUMER from './XGROUP_CREATECONSUMER';
import XGROUP_DELCONSUMER from './XGROUP_DELCONSUMER';
import XGROUP_DESTROY from './XGROUP_DESTROY';
import XGROUP_SETID from './XGROUP_SETID';
import XINFO_CONSUMERS from './XINFO_CONSUMERS';
import XINFO_GROUPS from './XINFO_GROUPS';
import XINFO_STREAM from './XINFO_STREAM';
import XLEN from './XLEN';
import XNACK from './XNACK';
import XPENDING_RANGE from './XPENDING_RANGE';
import XPENDING from './XPENDING';
import XRANGE from './XRANGE';
import XREAD from './XREAD';
import XREADGROUP from './XREADGROUP';
import XREVRANGE from './XREVRANGE';
import XSETID from './XSETID';
import XTRIM from './XTRIM';
import ZADD_INCR from './ZADD_INCR';
import ZADD from './ZADD';
import ZCARD from './ZCARD';
import ZCOUNT from './ZCOUNT';
import ZDIFF_WITHSCORES from './ZDIFF_WITHSCORES';
import ZDIFF from './ZDIFF';
import ZDIFFSTORE from './ZDIFFSTORE';
import ZINCRBY from './ZINCRBY';
import ZINTER_WITHSCORES from './ZINTER_WITHSCORES';
import ZINTER from './ZINTER';
import ZINTERCARD from './ZINTERCARD';
import ZINTERSTORE from './ZINTERSTORE';
import ZLEXCOUNT from './ZLEXCOUNT';
import ZMPOP from './ZMPOP';
import ZMSCORE from './ZMSCORE';
import ZPOPMAX_COUNT from './ZPOPMAX_COUNT';
import ZPOPMAX from './ZPOPMAX';
import ZPOPMIN_COUNT from './ZPOPMIN_COUNT';
import ZPOPMIN from './ZPOPMIN';
import ZRANDMEMBER_COUNT_WITHSCORES from './ZRANDMEMBER_COUNT_WITHSCORES';
import ZRANDMEMBER_COUNT from './ZRANDMEMBER_COUNT';
import ZRANDMEMBER from './ZRANDMEMBER';
import ZRANGE_WITHSCORES from './ZRANGE_WITHSCORES';
import ZRANGE from './ZRANGE';
import ZRANGEBYLEX from './ZRANGEBYLEX';
import ZRANGEBYSCORE_WITHSCORES from './ZRANGEBYSCORE_WITHSCORES';
import ZRANGEBYSCORE from './ZRANGEBYSCORE';
import ZRANGESTORE from './ZRANGESTORE';
import ZREMRANGEBYSCORE from './ZREMRANGEBYSCORE';
import ZRANK_WITHSCORE from './ZRANK_WITHSCORE';
import ZRANK from './ZRANK';
import ZREM from './ZREM';
import ZREMRANGEBYLEX from './ZREMRANGEBYLEX';
import ZREMRANGEBYRANK from './ZREMRANGEBYRANK';
import ZREVRANK from './ZREVRANK';
import ZSCAN from './ZSCAN';
import ZSCORE from './ZSCORE';
import ZUNION_WITHSCORES from './ZUNION_WITHSCORES';
import ZUNION from './ZUNION';
import ZUNIONSTORE from './ZUNIONSTORE';
import VADD from './VADD';
import VCARD from './VCARD';
import VDIM from './VDIM';
import VEMB from './VEMB';
import VEMB_RAW from './VEMB_RAW';
import VGETATTR from './VGETATTR';
import VINFO from './VINFO';
import VLINKS from './VLINKS';
import VLINKS_WITHSCORES from './VLINKS_WITHSCORES';
import VRANDMEMBER from './VRANDMEMBER';
import VRANGE from './VRANGE';
import VREM from './VREM';
import VSETATTR from './VSETATTR';
import VSIM from './VSIM';
import VSIM_WITHSCORES from './VSIM_WITHSCORES';
import LATENCY_HISTOGRAM from './LATENCY_HISTOGRAM';

export {
  CLIENT_KILL_FILTERS,
  FAILOVER_MODES,
  CLUSTER_SLOT_STATES,
  COMMAND_LIST_FILTER_BY,
  REDIS_FLUSH_MODES
};

export { SetOptions } from './SET';

export default {
  /**
   * Lists ACL categories or commands in a category
   * @param categoryName - Optional category name to filter commands
   */
  ACL_CAT,
  /**
   * Lists ACL categories or commands in a category
   * @param categoryName - Optional category name to filter commands
   */
  aclCat: ACL_CAT,
  /**
   * Deletes one or more users from the ACL
   * @param username - Username(s) to delete
   */
  ACL_DELUSER,
  /**
   * Deletes one or more users from the ACL
   * @param username - Username(s) to delete
   */
  aclDelUser: ACL_DELUSER,
  /**
   * Simulates ACL operations without executing them
   * @param username - Username to simulate ACL operations for
   * @param command - Command arguments to simulate
   */
  ACL_DRYRUN,
  /**
   * Simulates ACL operations without executing them
   * @param username - Username to simulate ACL operations for
   * @param command - Command arguments to simulate
   */
  aclDryRun: ACL_DRYRUN,
  /**
   * Generates a secure password for ACL users
   * @param bits - Optional number of bits for password entropy
   */
  ACL_GENPASS,
  /**
   * Generates a secure password for ACL users
   * @param bits - Optional number of bits for password entropy
   */
  aclGenPass: ACL_GENPASS,
  /**
   * Returns ACL information about a specific user
   * @param username - Username to get information for
   */
  ACL_GETUSER,
  /**
   * Returns ACL information about a specific user
   * @param username - Username to get information for
   */
  aclGetUser: ACL_GETUSER,
  /**
   * Returns all configured ACL users and their permissions
   */
  ACL_LIST,
  /**
   * Returns all configured ACL users and their permissions
   */
  aclList: ACL_LIST,
  /**
   * Reloads ACL configuration from the ACL file
   */
  ACL_LOAD,
  /**
   * Reloads ACL configuration from the ACL file
   */
  aclLoad: ACL_LOAD,
  /**
   * Clears the ACL security events log
   */
  ACL_LOG_RESET,
  /**
   * Clears the ACL security events log
   */
  aclLogReset: ACL_LOG_RESET,
  /**
   * Returns ACL security events log entries
   * @param count - Optional maximum number of entries to return
   */
  ACL_LOG,
  /**
   * Returns ACL security events log entries
   * @param count - Optional maximum number of entries to return
   */
  aclLog: ACL_LOG,
  /**
   * Saves the current ACL configuration to the ACL file
   */
  ACL_SAVE,
  /**
   * Saves the current ACL configuration to the ACL file
   */
  aclSave: ACL_SAVE,
  /**
   * Creates or modifies ACL user with specified rules
   * @param username - Username to create or modify
   * @param rule - ACL rule(s) to apply to the user
   */
  ACL_SETUSER,
  /**
   * Creates or modifies ACL user with specified rules
   * @param username - Username to create or modify
   * @param rule - ACL rule(s) to apply to the user
   */
  aclSetUser: ACL_SETUSER,
  /**
   * Returns a list of all configured ACL usernames
   */
  ACL_USERS,
  /**
   * Returns a list of all configured ACL usernames
   */
  aclUsers: ACL_USERS,
  /**
   * Returns the username of the current connection
   */
  ACL_WHOAMI,
  /**
   * Returns the username of the current connection
   */
  aclWhoAmI: ACL_WHOAMI,
  /**
   * Appends a value to a string key
   * @param key - The key to append to
   * @param value - The value to append
   */
  APPEND,
  /**
   * Appends a value to a string key
   * @param key - The key to append to
   * @param value - The value to append
   */
  append: APPEND,
  /**
   * Tells a Redis cluster node that the client is ok receiving such redirects
   */
  ASKING,
  /**
   * Tells a Redis cluster node that the client is ok receiving such redirects
   */
  asking: ASKING,
  /**
   * Authenticates the connection using a password or username and password
   * @param options - Authentication options containing username and/or password
   * @param options.username - Optional username for authentication
   * @param options.password - Password for authentication
   */
  AUTH,
  /**
   * Authenticates the connection using a password or username and password
   * @param options - Authentication options containing username and/or password
   * @param options.username - Optional username for authentication
   * @param options.password - Password for authentication
   */
  auth: AUTH,
  /**
   * Asynchronously rewrites the append-only file
   */
  BGREWRITEAOF,
  /**
   * Asynchronously rewrites the append-only file
   */
  bgRewriteAof: BGREWRITEAOF,
  /**
   * Asynchronously saves the dataset to disk
   * @param options - Optional configuration
   * @param options.SCHEDULE - Schedule a BGSAVE operation when no BGSAVE is already in progress
   */
  BGSAVE,
  /**
   * Asynchronously saves the dataset to disk
   * @param options - Optional configuration
   * @param options.SCHEDULE - Schedule a BGSAVE operation when no BGSAVE is already in progress
   */
  bgSave: BGSAVE,
  /**
   * Returns the count of set bits in a string key
   * @param key - The key to count bits in
   * @param range - Optional range specification
   * @param range.start - Start offset in bytes/bits
   * @param range.end - End offset in bytes/bits
   * @param range.mode - Optional counting mode: BYTE or BIT
   */
  BITCOUNT,
  /**
   * Returns the count of set bits in a string key
   * @param key - The key to count bits in
   * @param range - Optional range specification
   * @param range.start - Start offset in bytes/bits
   * @param range.end - End offset in bytes/bits
   * @param range.mode - Optional counting mode: BYTE or BIT
   */
  bitCount: BITCOUNT,
  /**
   * Performs read-only bitfield integer operations on strings
   * @param key - The key holding the string
   * @param operations - Array of GET operations to perform on the bitfield
   */
  BITFIELD_RO,
  /**
   * Performs read-only bitfield integer operations on strings
   * @param key - The key holding the string
   * @param operations - Array of GET operations to perform on the bitfield
   */
  bitFieldRo: BITFIELD_RO,
  /**
   * Performs arbitrary bitfield integer operations on strings
   * @param key - The key holding the string
   * @param operations - Array of bitfield operations to perform: GET, SET, INCRBY or OVERFLOW
   */
  BITFIELD,
  /**
   * Performs arbitrary bitfield integer operations on strings
   * @param key - The key holding the string
   * @param operations - Array of bitfield operations to perform: GET, SET, INCRBY or OVERFLOW
   */
  bitField: BITFIELD,
  /**
   * Performs bitwise operations between strings
   * @param operation - Bitwise operation to perform: AND, OR, XOR, NOT, DIFF, DIFF1, ANDOR, ONE
   * @param destKey - Destination key to store the result
   * @param key - Source key(s) to perform operation on
   */
  BITOP,
  /**
   * Performs bitwise operations between strings
   * @param operation - Bitwise operation to perform: AND, OR, XOR, NOT, DIFF, DIFF1, ANDOR, ONE
   * @param destKey - Destination key to store the result
   * @param key - Source key(s) to perform operation on
   */
  bitOp: BITOP,
  /**
   * Returns the position of first bit set to 0 or 1 in a string
   * @param key - The key holding the string
   * @param bit - The bit value to look for (0 or 1)
   * @param start - Optional starting position in bytes/bits
   * @param end - Optional ending position in bytes/bits
   * @param mode - Optional counting mode: BYTE or BIT
   */
  BITPOS,
  /**
   * Returns the position of first bit set to 0 or 1 in a string
   * @param key - The key holding the string
   * @param bit - The bit value to look for (0 or 1)
   * @param start - Optional starting position in bytes/bits
   * @param end - Optional ending position in bytes/bits
   * @param mode - Optional counting mode: BYTE or BIT
   */
  bitPos: BITPOS,
  /**
   * Pop an element from a list, push it to another list and return it; or block until one is available
   * @param source - Key of the source list
   * @param destination - Key of the destination list
   * @param sourceSide - Side of source list to pop from (LEFT or RIGHT)
   * @param destinationSide - Side of destination list to push to (LEFT or RIGHT)
   * @param timeout - Timeout in seconds, 0 to block indefinitely
   */
  BLMOVE,
  /**
   * Pop an element from a list, push it to another list and return it; or block until one is available
   * @param source - Key of the source list
   * @param destination - Key of the destination list
   * @param sourceSide - Side of source list to pop from (LEFT or RIGHT)
   * @param destinationSide - Side of destination list to push to (LEFT or RIGHT)
   * @param timeout - Timeout in seconds, 0 to block indefinitely
   */
  blMove: BLMOVE,
  /**
   * Pops elements from multiple lists; blocks until elements are available
   * @param timeout - Timeout in seconds, 0 to block indefinitely
   * @param args - Additional arguments for LMPOP command
   */
  BLMPOP,
  /**
   * Pops elements from multiple lists; blocks until elements are available
   * @param timeout - Timeout in seconds, 0 to block indefinitely
   * @param args - Additional arguments for LMPOP command
   */
  blmPop: BLMPOP,
  /**
   * Removes and returns the first element in a list, or blocks until one is available
   * @param key - Key of the list to pop from, or array of keys to try sequentially
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  BLPOP,
  /**
   * Removes and returns the first element in a list, or blocks until one is available
   * @param key - Key of the list to pop from, or array of keys to try sequentially
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  blPop: BLPOP,
  /**
   * Removes and returns the last element in a list, or blocks until one is available
   * @param key - Key of the list to pop from, or array of keys to try sequentially
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  BRPOP,
  /**
   * Removes and returns the last element in a list, or blocks until one is available
   * @param key - Key of the list to pop from, or array of keys to try sequentially
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  brPop: BRPOP,
  /**
   * Pops an element from a list, pushes it to another list and returns it; blocks until element is available
   * @param source - Key of the source list to pop from
   * @param destination - Key of the destination list to push to
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  BRPOPLPUSH,
  /**
   * Pops an element from a list, pushes it to another list and returns it; blocks until element is available
   * @param source - Key of the source list to pop from
   * @param destination - Key of the destination list to push to
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  brPopLPush: BRPOPLPUSH,
  /**
   * Removes and returns members from one or more sorted sets in the specified order; blocks until elements are available
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   * @param args - Additional arguments specifying the keys, min/max count, and order (MIN/MAX)
   */
  BZMPOP,
  /**
   * Removes and returns members from one or more sorted sets in the specified order; blocks until elements are available
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   * @param args - Additional arguments specifying the keys, min/max count, and order (MIN/MAX)
   */
  bzmPop: BZMPOP,
  /**
   * Removes and returns the member with the highest score in a sorted set, or blocks until one is available
   * @param keys - Key of the sorted set, or array of keys to try sequentially
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  BZPOPMAX,
  /**
   * Removes and returns the member with the highest score in a sorted set, or blocks until one is available
   * @param keys - Key of the sorted set, or array of keys to try sequentially
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  bzPopMax: BZPOPMAX,
  /**
   * Removes and returns the member with the lowest score in a sorted set, or blocks until one is available
   * @param keys - Key of the sorted set, or array of keys to try sequentially
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  BZPOPMIN,
  /**
   * Removes and returns the member with the lowest score in a sorted set, or blocks until one is available
   * @param keys - Key of the sorted set, or array of keys to try sequentially
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  bzPopMin: BZPOPMIN,
  /**
   * Instructs the server about tracking or not keys in the next request
   * @param value - Whether to enable (true) or disable (false) tracking
   */
  CLIENT_CACHING,
  /**
   * Instructs the server about tracking or not keys in the next request
   * @param value - Whether to enable (true) or disable (false) tracking
   */
  clientCaching: CLIENT_CACHING,
  /**
   * Returns the name of the current connection
   */
  CLIENT_GETNAME,
  /**
   * Returns the name of the current connection
   */
  clientGetName: CLIENT_GETNAME,
  /**
   * Returns the ID of the client to which the current client is redirecting tracking notifications
   */
  CLIENT_GETREDIR,
  /**
   * Returns the ID of the client to which the current client is redirecting tracking notifications
   */
  clientGetRedir: CLIENT_GETREDIR,
  /**
   * Returns the client ID for the current connection
   */
  CLIENT_ID,
  /**
   * Returns the client ID for the current connection
   */
  clientId: CLIENT_ID,
  /**
   * Returns information and statistics about the current client connection
   */
  CLIENT_INFO,
  /**
   * Returns information and statistics about the current client connection
   */
  clientInfo: CLIENT_INFO,
  /**
   * Closes client connections matching the specified filters
   * @param filters - One or more filters to match client connections to kill
   */
  CLIENT_KILL,
  /**
   * Closes client connections matching the specified filters
   * @param filters - One or more filters to match client connections to kill
   */
  clientKill: CLIENT_KILL,
  /**
   * Returns information about all client connections. Can be filtered by type or ID
   * @param filter - Optional filter to return only specific client types or IDs
   */
  CLIENT_LIST,
  /**
   * Returns information about all client connections. Can be filtered by type or ID
   * @param filter - Optional filter to return only specific client types or IDs
   */
  clientList: CLIENT_LIST,
  /**
   * Controls whether to prevent the client's connections from being evicted
   * @param value - Whether to enable (true) or disable (false) the no-evict mode
   */
  'CLIENT_NO-EVICT': CLIENT_NO_EVICT,
  /**
   * Controls whether to prevent the client's connections from being evicted
   * @param value - Whether to enable (true) or disable (false) the no-evict mode
   */
  clientNoEvict: CLIENT_NO_EVICT,
  /**
   * Controls whether to prevent the client from touching the LRU/LFU of keys
   * @param value - Whether to enable (true) or disable (false) the no-touch mode
   */
  'CLIENT_NO-TOUCH': CLIENT_NO_TOUCH,
  /**
   * Controls whether to prevent the client from touching the LRU/LFU of keys
   * @param value - Whether to enable (true) or disable (false) the no-touch mode
   */
  clientNoTouch: CLIENT_NO_TOUCH,
  /**
   * Stops the server from processing client commands for the specified duration
   * @param timeout - Time in milliseconds to pause command processing
   * @param mode - Optional mode: 'WRITE' to pause only write commands, 'ALL' to pause all commands
   */
  CLIENT_PAUSE,
  /**
   * Stops the server from processing client commands for the specified duration
   * @param timeout - Time in milliseconds to pause command processing
   * @param mode - Optional mode: 'WRITE' to pause only write commands, 'ALL' to pause all commands
   */
  clientPause: CLIENT_PAUSE,
  /**
   * Assigns a name to the current connection
   * @param name - The name to assign to the connection
   */
  CLIENT_SETNAME,
  /**
   * Assigns a name to the current connection
   * @param name - The name to assign to the connection
   */
  clientSetName: CLIENT_SETNAME,
  /**
   * Controls server-assisted client side caching for the current connection
   * @param mode - Whether to enable (true) or disable (false) tracking
   * @param options - Optional configuration including REDIRECT, BCAST, PREFIX, OPTIN, OPTOUT, and NOLOOP options
   */
  CLIENT_TRACKING,
  /**
   * Controls server-assisted client side caching for the current connection
   * @param mode - Whether to enable (true) or disable (false) tracking
   * @param options - Optional configuration including REDIRECT, BCAST, PREFIX, OPTIN, OPTOUT, and NOLOOP options
   */
  clientTracking: CLIENT_TRACKING,
  /**
   * Returns information about the current connection's key tracking state
   */
  CLIENT_TRACKINGINFO,
  /**
   * Returns information about the current connection's key tracking state
   */
  clientTrackingInfo: CLIENT_TRACKINGINFO,
  /**
   * Resumes processing of client commands after a CLIENT PAUSE
   */
  CLIENT_UNPAUSE,
  /**
   * Resumes processing of client commands after a CLIENT PAUSE
   */
  clientUnpause: CLIENT_UNPAUSE,
  /**
   * Assigns hash slots to the current node in a Redis Cluster
   * @param slots - One or more hash slots to be assigned
   */
  CLUSTER_ADDSLOTS,
  /**
   * Assigns hash slots to the current node in a Redis Cluster
   * @param slots - One or more hash slots to be assigned
   */
  clusterAddSlots: CLUSTER_ADDSLOTS,
  /**
   * Assigns hash slot ranges to the current node in a Redis Cluster
   * @param ranges - One or more slot ranges to be assigned, each specified as [start, end]
   */
  CLUSTER_ADDSLOTSRANGE,
  /**
   * Assigns hash slot ranges to the current node in a Redis Cluster
   * @param ranges - One or more slot ranges to be assigned, each specified as [start, end]
   */
  clusterAddSlotsRange: CLUSTER_ADDSLOTSRANGE,
  /**
   * Advances the cluster config epoch
   */
  CLUSTER_BUMPEPOCH,
  /**
   * Advances the cluster config epoch
   */
  clusterBumpEpoch: CLUSTER_BUMPEPOCH,
  /**
   * Returns the number of failure reports for a given node
   * @param nodeId - The ID of the node to check
   */
  'CLUSTER_COUNT-FAILURE-REPORTS': CLUSTER_COUNT_FAILURE_REPORTS,
  /**
   * Returns the number of failure reports for a given node
   * @param nodeId - The ID of the node to check
   */
  clusterCountFailureReports: CLUSTER_COUNT_FAILURE_REPORTS,
  /**
   * Returns the number of keys in the specified hash slot
   * @param slot - The hash slot to check
   */
  CLUSTER_COUNTKEYSINSLOT,
  /**
   * Returns the number of keys in the specified hash slot
   * @param slot - The hash slot to check
   */
  clusterCountKeysInSlot: CLUSTER_COUNTKEYSINSLOT,
  /**
   * Removes hash slots from the current node in a Redis Cluster
   * @param slots - One or more hash slots to be removed
   */
  CLUSTER_DELSLOTS,
  /**
   * Removes hash slots from the current node in a Redis Cluster
   * @param slots - One or more hash slots to be removed
   */
  clusterDelSlots: CLUSTER_DELSLOTS,
  /**
   * Removes hash slot ranges from the current node in a Redis Cluster
   * @param ranges - One or more slot ranges to be removed, each specified as [start, end]
   */
  CLUSTER_DELSLOTSRANGE,
  /**
   * Removes hash slot ranges from the current node in a Redis Cluster
   * @param ranges - One or more slot ranges to be removed, each specified as [start, end]
   */
  clusterDelSlotsRange: CLUSTER_DELSLOTSRANGE,
  /**
   * Forces a replica to perform a manual failover of its master
   * @param options - Optional configuration with FORCE or TAKEOVER mode
   */
  CLUSTER_FAILOVER,
  /**
   * Forces a replica to perform a manual failover of its master
   * @param options - Optional configuration with FORCE or TAKEOVER mode
   */
  clusterFailover: CLUSTER_FAILOVER,
  /**
   * Deletes all hash slots from the current node in a Redis Cluster
   */
  CLUSTER_FLUSHSLOTS,
  /**
   * Deletes all hash slots from the current node in a Redis Cluster
   */
  clusterFlushSlots: CLUSTER_FLUSHSLOTS,
  /**
   * Removes a node from the cluster
   * @param nodeId - The ID of the node to remove
   */
  CLUSTER_FORGET,
  /**
   * Removes a node from the cluster
   * @param nodeId - The ID of the node to remove
   */
  clusterForget: CLUSTER_FORGET,
  /**
   * Returns a number of keys from the specified hash slot
   * @param slot - The hash slot to get keys from
   * @param count - Maximum number of keys to return
   */
  CLUSTER_GETKEYSINSLOT,
  /**
   * Returns a number of keys from the specified hash slot
   * @param slot - The hash slot to get keys from
   * @param count - Maximum number of keys to return
   */
  clusterGetKeysInSlot: CLUSTER_GETKEYSINSLOT,
  /**
   * Returns information about the state of a Redis Cluster
   */
  CLUSTER_INFO,
  /**
   * Returns information about the state of a Redis Cluster
   */
  clusterInfo: CLUSTER_INFO,
  /**
   * Returns the hash slot number for a given key
   * @param key - The key to get the hash slot for
   */
  CLUSTER_KEYSLOT,
  /**
   * Returns the hash slot number for a given key
   * @param key - The key to get the hash slot for
   */
  clusterKeySlot: CLUSTER_KEYSLOT,
  /**
   * Returns information about all cluster links (lower level connections to other nodes)
   */
  CLUSTER_LINKS,
  /**
   * Returns information about all cluster links (lower level connections to other nodes)
   */
  clusterLinks: CLUSTER_LINKS,
  /**
   * Initiates a handshake with another node in the cluster
   * @param host - Host name or IP address of the node
   * @param port - TCP port of the node
   */
  CLUSTER_MEET,
  /**
   * Initiates a handshake with another node in the cluster
   * @param host - Host name or IP address of the node
   * @param port - TCP port of the node
   */
  clusterMeet: CLUSTER_MEET,
  /**
   * Returns the node ID of the current Redis Cluster node
   */
  CLUSTER_MYID,
  /**
   * Returns the node ID of the current Redis Cluster node
   */
  clusterMyId: CLUSTER_MYID,
  /**
   * Returns the shard ID of the current Redis Cluster node
   */
  CLUSTER_MYSHARDID,
  /**
   * Returns the shard ID of the current Redis Cluster node
   */
  clusterMyShardId: CLUSTER_MYSHARDID,
  /**
   * Returns serialized information about the nodes in a Redis Cluster
   */
  CLUSTER_NODES,
  /**
   * Returns serialized information about the nodes in a Redis Cluster
   */
  clusterNodes: CLUSTER_NODES,
  /**
   * Returns the replica nodes replicating from the specified primary node
   * @param nodeId - Node ID of the primary node
   */
  CLUSTER_REPLICAS,
  /**
   * Returns the replica nodes replicating from the specified primary node
   * @param nodeId - Node ID of the primary node
   */
  clusterReplicas: CLUSTER_REPLICAS,
  /**
   * Reconfigures a node as a replica of the specified primary node
   * @param nodeId - Node ID of the primary node to replicate
   */
  CLUSTER_REPLICATE,
  /**
   * Reconfigures a node as a replica of the specified primary node
   * @param nodeId - Node ID of the primary node to replicate
   */
  clusterReplicate: CLUSTER_REPLICATE,
  /**
   * Resets a Redis Cluster node, clearing all information and returning it to a brand new state
   * @param options - Options for the reset operation
   */
  CLUSTER_RESET,
  /**
   * Resets a Redis Cluster node, clearing all information and returning it to a brand new state
   * @param options - Options for the reset operation
   */
  clusterReset: CLUSTER_RESET,
  /**
   * Forces a Redis Cluster node to save the cluster configuration to disk
   */
  CLUSTER_SAVECONFIG,
  /**
   * Forces a Redis Cluster node to save the cluster configuration to disk
   */
  clusterSaveConfig: CLUSTER_SAVECONFIG,
  /**
   * Sets the configuration epoch for a Redis Cluster node
   * @param configEpoch - The configuration epoch to set
   */
  'CLUSTER_SET-CONFIG-EPOCH': CLUSTER_SET_CONFIG_EPOCH,
  /**
   * Sets the configuration epoch for a Redis Cluster node
   * @param configEpoch - The configuration epoch to set
   */
  clusterSetConfigEpoch: CLUSTER_SET_CONFIG_EPOCH,
  /**
   * Assigns a hash slot to a specific Redis Cluster node
   * @param slot - The slot number to assign
   * @param state - The state to set for the slot (IMPORTING, MIGRATING, STABLE, NODE)
   * @param nodeId - Node ID (required for IMPORTING, MIGRATING, and NODE states)
   */
  CLUSTER_SETSLOT,
  /**
   * Assigns a hash slot to a specific Redis Cluster node
   * @param slot - The slot number to assign
   * @param state - The state to set for the slot (IMPORTING, MIGRATING, STABLE, NODE)
   * @param nodeId - Node ID (required for IMPORTING, MIGRATING, and NODE states)
   */
  clusterSetSlot: CLUSTER_SETSLOT,
  /**
   * Returns information about which Redis Cluster node handles which hash slots
   */
  CLUSTER_SLOTS,
  /**
   * Returns information about which Redis Cluster node handles which hash slots
   */
  clusterSlots: CLUSTER_SLOTS,
  /**
   * Returns the total number of commands available in the Redis server
   */
  COMMAND_COUNT,
  /**
   * Returns the total number of commands available in the Redis server
   */
  commandCount: COMMAND_COUNT,
  /**
   * Extracts the key names from a Redis command
   * @param args - Command arguments to analyze
   */
  COMMAND_GETKEYS,
  /**
   * Extracts the key names from a Redis command
   * @param args - Command arguments to analyze
   */
  commandGetKeys: COMMAND_GETKEYS,
  /**
   * Extracts the key names and access flags from a Redis command
   * @param args - Command arguments to analyze
   */
  COMMAND_GETKEYSANDFLAGS,
  /**
   * Extracts the key names and access flags from a Redis command
   * @param args - Command arguments to analyze
   */
  commandGetKeysAndFlags: COMMAND_GETKEYSANDFLAGS,
  /**
   * Returns details about specific Redis commands
   * @param commands - Array of command names to get information about
   */
  COMMAND_INFO,
  /**
   * Returns details about specific Redis commands
   * @param commands - Array of command names to get information about
   */
  commandInfo: COMMAND_INFO,
  /**
   * Returns a list of all commands supported by the Redis server
   * @param options - Options for filtering the command list
   */
  COMMAND_LIST,
  /**
   * Returns a list of all commands supported by the Redis server
   * @param options - Options for filtering the command list
   */
  commandList: COMMAND_LIST,
  /**
   * Returns an array with details about all Redis commands
   */
  COMMAND,
  /**
   * Returns an array with details about all Redis commands
   */
  command: COMMAND,
  /**
   * Gets the values of configuration parameters
   * @param parameters - Pattern or specific configuration parameter names
   */
  CONFIG_GET,
  /**
   * Gets the values of configuration parameters
   * @param parameters - Pattern or specific configuration parameter names
   */
  configGet: CONFIG_GET,
  /**
   * Resets the statistics reported by Redis using the INFO command
   */
  CONFIG_RESETASTAT,
  /**
   * Resets the statistics reported by Redis using the INFO command
   */
  configResetStat: CONFIG_RESETASTAT,
  /**
   * Rewrites the Redis configuration file with the current configuration
   */
  CONFIG_REWRITE,
  /**
   * Rewrites the Redis configuration file with the current configuration
   */
  configRewrite: CONFIG_REWRITE,
  /**
   * Sets configuration parameters to the specified values
   * @param parameterOrConfig - Either a single parameter name or a configuration object
   * @param value - Value for the parameter (when using single parameter format)
   */
  CONFIG_SET,
  /**
   * Sets configuration parameters to the specified values
   * @param parameterOrConfig - Either a single parameter name or a configuration object
   * @param value - Value for the parameter (when using single parameter format)
   */
  configSet: CONFIG_SET,
  /**
   * Copies the value stored at the source key to the destination key
   * @param source - Source key
   * @param destination - Destination key
   * @param options - Options for the copy operation
   */
  COPY,
  /**
   * Copies the value stored at the source key to the destination key
   * @param source - Source key
   * @param destination - Destination key
   * @param options - Options for the copy operation
   */
  copy: COPY,
  /**
   * Returns the number of keys in the current database
   */
  DBSIZE,
  /**
   * Returns the number of keys in the current database
   */
  dbSize: DBSIZE,
  /**
   * Decrements the integer value of a key by one
   * @param key - Key to decrement
   */
  DECR,
  /**
   * Decrements the integer value of a key by one
   * @param key - Key to decrement
   */
  decr: DECR,
  /**
   * Decrements the integer value of a key by the given number
   * @param key - Key to decrement
   * @param decrement - Decrement amount
   */
  DECRBY,
  /**
   * Decrements the integer value of a key by the given number
   * @param key - Key to decrement
   * @param decrement - Decrement amount
   */
  decrBy: DECRBY,
  /**
   * Removes the specified keys. A key is ignored if it does not exist
   * @param keys - One or more keys to delete
   */
  DEL,
  /**
   * Removes the specified keys. A key is ignored if it does not exist
   * @param keys - One or more keys to delete
   */
  del: DEL,
  /**
   *
   * @experimental
   *
   * Conditionally removes the specified key based on value or digest comparison.
   *
   * @param key - Key to delete
   */
  DELEX,
  /**
   *
   * @experimental
   *
   * Conditionally removes the specified key based on value or digest comparison.
   *
   * @param key - Key to delete
   */
  delEx: DELEX,
  /**
   *
   * @experimental
   *
   * Returns the XXH3 hash of a string value.
   *
   * @param key - Key to get the digest of
   */
  DIGEST,
  /**
   *
   * @experimental
   *
   * Returns the XXH3 hash of a string value.
   *
   * @param key - Key to get the digest of
   */
  digest: DIGEST,
  /**
   * Returns a serialized version of the value stored at the key
   * @param key - Key to dump
   */
  DUMP,
  /**
   * Returns a serialized version of the value stored at the key
   * @param key - Key to dump
   */
  dump: DUMP,
  /**
   * Returns the given string
   * @param message - Message to echo back
   */
  ECHO,
  /**
   * Returns the given string
   * @param message - Message to echo back
   */
  echo: ECHO,
  /**
   * Executes a read-only Lua script server side
   * @param script - Lua script to execute
   * @param options - Script execution options including keys and arguments
   */
  EVAL_RO,
  /**
   * Executes a read-only Lua script server side
   * @param script - Lua script to execute
   * @param options - Script execution options including keys and arguments
   */
  evalRo: EVAL_RO,
  /**
   * Executes a Lua script server side
   * @param script - Lua script to execute
   * @param options - Script execution options including keys and arguments
   */
  EVAL,
  /**
   * Executes a Lua script server side
   * @param script - Lua script to execute
   * @param options - Script execution options including keys and arguments
   */
  eval: EVAL,
  /**
   * Executes a read-only Lua script server side using the script's SHA1 digest
   * @param sha1 - SHA1 digest of the script
   * @param options - Script execution options including keys and arguments
   */
  EVALSHA_RO,
  /**
   * Executes a read-only Lua script server side using the script's SHA1 digest
   * @param sha1 - SHA1 digest of the script
   * @param options - Script execution options including keys and arguments
   */
  evalShaRo: EVALSHA_RO,
  /**
   * Executes a Lua script server side using the script's SHA1 digest
   * @param sha1 - SHA1 digest of the script
   * @param options - Script execution options including keys and arguments
   */
  EVALSHA,
  /**
   * Executes a Lua script server side using the script's SHA1 digest
   * @param sha1 - SHA1 digest of the script
   * @param options - Script execution options including keys and arguments
   */
  evalSha: EVALSHA,
  /**
   * Determines if the specified keys exist
   * @param keys - One or more keys to check
   */
  EXISTS,
  /**
   * Determines if the specified keys exist
   * @param keys - One or more keys to check
   */
  exists: EXISTS,
  /**
   * Sets a timeout on key. After the timeout has expired, the key will be automatically deleted
   * @param key - Key to set expiration on
   * @param seconds - Number of seconds until key expiration
   * @param mode - Expiration mode: NX (only if key has no expiry), XX (only if key has existing expiry), GT (only if new expiry is greater than current), LT (only if new expiry is less than current)
   */
  EXPIRE,
  /**
   * Sets a timeout on key. After the timeout has expired, the key will be automatically deleted
   * @param key - Key to set expiration on
   * @param seconds - Number of seconds until key expiration
   * @param mode - Expiration mode: NX (only if key has no expiry), XX (only if key has existing expiry), GT (only if new expiry is greater than current), LT (only if new expiry is less than current)
   */
  expire: EXPIRE,
  /**
   * Sets the expiration for a key at a specific Unix timestamp
   * @param key - Key to set expiration on
   * @param timestamp - Unix timestamp (seconds since January 1, 1970) or Date object
   * @param mode - Expiration mode: NX (only if key has no expiry), XX (only if key has existing expiry), GT (only if new expiry is greater than current), LT (only if new expiry is less than current)
   */
  EXPIREAT,
  /**
   * Sets the expiration for a key at a specific Unix timestamp
   * @param key - Key to set expiration on
   * @param timestamp - Unix timestamp (seconds since January 1, 1970) or Date object
   * @param mode - Expiration mode: NX (only if key has no expiry), XX (only if key has existing expiry), GT (only if new expiry is greater than current), LT (only if new expiry is less than current)
   */
  expireAt: EXPIREAT,
  /**
   * Returns the absolute Unix timestamp (since January 1, 1970) at which the given key will expire
   * @param key - Key to check expiration time
   */
  EXPIRETIME,
  /**
   * Returns the absolute Unix timestamp (since January 1, 1970) at which the given key will expire
   * @param key - Key to check expiration time
   */
  expireTime: EXPIRETIME,
  /**
   * Removes all keys from all databases
   * @param mode - Optional flush mode (ASYNC or SYNC)
   */
  FLUSHALL,
  /**
   * Removes all keys from all databases
   * @param mode - Optional flush mode (ASYNC or SYNC)
   */
  flushAll: FLUSHALL,
  /**
   * Removes all keys from the current database
   * @param mode - Optional flush mode (ASYNC or SYNC)
   */
  FLUSHDB,
  /**
   * Removes all keys from the current database
   * @param mode - Optional flush mode (ASYNC or SYNC)
   */
  flushDb: FLUSHDB,
  /**
   * Invokes a Redis function
   * @param functionName - Name of the function to call
   * @param options - Function execution options including keys and arguments
   */
  FCALL,
  /**
   * Invokes a Redis function
   * @param functionName - Name of the function to call
   * @param options - Function execution options including keys and arguments
   */
  fCall: FCALL,
  /**
   * Invokes a read-only Redis function
   * @param functionName - Name of the function to call
   * @param options - Function execution options including keys and arguments
   */
  FCALL_RO,
  /**
   * Invokes a read-only Redis function
   * @param functionName - Name of the function to call
   * @param options - Function execution options including keys and arguments
   */
  fCallRo: FCALL_RO,
  /**
   * Deletes a library and all its functions
   * @param library - Name of the library to delete
   */
  FUNCTION_DELETE,
  /**
   * Deletes a library and all its functions
   * @param library - Name of the library to delete
   */
  functionDelete: FUNCTION_DELETE,
  /**
   * Returns a serialized payload representing the current functions loaded in the server
   */
  FUNCTION_DUMP,
  /**
   * Returns a serialized payload representing the current functions loaded in the server
   */
  functionDump: FUNCTION_DUMP,
  /**
   * Deletes all the libraries and functions from a Redis server
   * @param mode - Optional flush mode (ASYNC or SYNC)
   */
  FUNCTION_FLUSH,
  /**
   * Deletes all the libraries and functions from a Redis server
   * @param mode - Optional flush mode (ASYNC or SYNC)
   */
  functionFlush: FUNCTION_FLUSH,
  /**
   * Kills a function that is currently executing
   */
  FUNCTION_KILL,
  /**
   * Kills a function that is currently executing
   */
  functionKill: FUNCTION_KILL,
  /**
   * Returns all libraries and functions including their source code
   * @param options - Options for listing functions
   */
  FUNCTION_LIST_WITHCODE,
  /**
   * Returns all libraries and functions including their source code
   * @param options - Options for listing functions
   */
  functionListWithCode: FUNCTION_LIST_WITHCODE,
  /**
   * Returns all libraries and functions
   * @param options - Options for listing functions
   */
  FUNCTION_LIST,
  /**
   * Returns all libraries and functions
   * @param options - Options for listing functions
   */
  functionList: FUNCTION_LIST,
  /**
   * Loads a library to Redis
   * @param code - Library code to load
   * @param options - Function load options
   */
  FUNCTION_LOAD,
  /**
   * Loads a library to Redis
   * @param code - Library code to load
   * @param options - Function load options
   */
  functionLoad: FUNCTION_LOAD,
  /**
   * Restores libraries from the dump payload
   * @param dump - Serialized payload of functions to restore
   * @param options - Options for the restore operation
   */
  FUNCTION_RESTORE,
  /**
   * Restores libraries from the dump payload
   * @param dump - Serialized payload of functions to restore
   * @param options - Options for the restore operation
   */
  functionRestore: FUNCTION_RESTORE,
  /**
   * Returns information about the function that is currently running and information about the available execution engines
   */
  FUNCTION_STATS,
  /**
   * Returns information about the function that is currently running and information about the available execution engines
   */
  functionStats: FUNCTION_STATS,
  /**
   * Rate limit via GCRA (Generic Cell Rate Algorithm).
   * `tokensPerPeriod` are allowed per `period` at a sustained rate, which implies
   * a minimum emission interval of `period / tokensPerPeriod` seconds between requests.
   * `maxBurst` allows occasional spikes by permitting up to `maxBurst` additional
   * tokens to be consumed at once.
   * @param key - Key associated with the rate limit bucket
   * @param maxBurst - Maximum number of extra tokens allowed as burst (min 0)
   * @param tokensPerPeriod - Number of tokens allowed per period (min 1)
   * @param period - Period in seconds as a float for sustained rate calculation (min 1.0, max 1e12)
   * @param tokens - Optional request cost (weight). If omitted, defaults to 1
   * @see https://redis.io/commands/gcra/
   */
  GCRA,
  /**
   * Rate limit via GCRA (Generic Cell Rate Algorithm).
   * `tokensPerPeriod` are allowed per `period` at a sustained rate, which implies
   * a minimum emission interval of `period / tokensPerPeriod` seconds between requests.
   * `maxBurst` allows occasional spikes by permitting up to `maxBurst` additional
   * tokens to be consumed at once.
   * @param key - Key associated with the rate limit bucket
   * @param maxBurst - Maximum number of extra tokens allowed as burst (min 0)
   * @param tokensPerPeriod - Number of tokens allowed per period (min 1)
   * @param period - Period in seconds as a float for sustained rate calculation (min 1.0, max 1e12)
   * @param tokens - Optional request cost (weight). If omitted, defaults to 1
   * @see https://redis.io/commands/gcra/
   */
  gcra: GCRA,
  /**
   * Adds geospatial items to the specified key
   * @param key - Key to add the geospatial items to
   * @param toAdd - Geospatial member(s) to add
   * @param options - Options for the GEOADD command
   */
  GEOADD,
  /**
   * Adds geospatial items to the specified key
   * @param key - Key to add the geospatial items to
   * @param toAdd - Geospatial member(s) to add
   * @param options - Options for the GEOADD command
   */
  geoAdd: GEOADD,
  /**
   * Returns the distance between two members in a geospatial index
   * @param key - Key of the geospatial index
   * @param member1 - First member in the geospatial index
   * @param member2 - Second member in the geospatial index
   * @param unit - Unit of distance (m, km, ft, mi)
   */
  GEODIST,
  /**
   * Returns the distance between two members in a geospatial index
   * @param key - Key of the geospatial index
   * @param member1 - First member in the geospatial index
   * @param member2 - Second member in the geospatial index
   * @param unit - Unit of distance (m, km, ft, mi)
   */
  geoDist: GEODIST,
  /**
   * Returns the Geohash string representation of one or more position members
   * @param key - Key of the geospatial index
   * @param member - One or more members in the geospatial index
   */
  GEOHASH,
  /**
   * Returns the Geohash string representation of one or more position members
   * @param key - Key of the geospatial index
   * @param member - One or more members in the geospatial index
   */
  geoHash: GEOHASH,
  /**
   * Returns the longitude and latitude of one or more members in a geospatial index
   * @param key - Key of the geospatial index
   * @param member - One or more members in the geospatial index
   */
  GEOPOS,
  /**
   * Returns the longitude and latitude of one or more members in a geospatial index
   * @param key - Key of the geospatial index
   * @param member - One or more members in the geospatial index
   */
  geoPos: GEOPOS,
  /**
   * Read-only variant that queries members in a geospatial index based on a radius from a center point with additional information
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param replyWith - Information to include with each returned member
   * @param options - Additional search options
   */
  GEORADIUS_RO_WITH,
  /**
   * Read-only variant that queries members in a geospatial index based on a radius from a center point with additional information
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param replyWith - Information to include with each returned member
   * @param options - Additional search options
   */
  geoRadiusRoWith: GEORADIUS_RO_WITH,
  /**
   * Read-only variant that queries members in a geospatial index based on a radius from a center point
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param options - Additional search options
   */
  GEORADIUS_RO,
  /**
   * Read-only variant that queries members in a geospatial index based on a radius from a center point
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param options - Additional search options
   */
  geoRadiusRo: GEORADIUS_RO,
  /**
   * Queries members in a geospatial index based on a radius from a center point and stores the results
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param destination - Key to store the results
   * @param options - Additional search and storage options
   */
  GEORADIUS_STORE,
  /**
   * Queries members in a geospatial index based on a radius from a center point and stores the results
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param destination - Key to store the results
   * @param options - Additional search and storage options
   */
  geoRadiusStore: GEORADIUS_STORE,
  /**
   * Queries members in a geospatial index based on a radius from a center point with additional information
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param replyWith - Information to include with each returned member
   * @param options - Additional search options
   */
  GEORADIUS_WITH,
  /**
   * Queries members in a geospatial index based on a radius from a center point with additional information
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param replyWith - Information to include with each returned member
   * @param options - Additional search options
   */
  geoRadiusWith: GEORADIUS_WITH,
  /**
   * Queries members in a geospatial index based on a radius from a center point
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param options - Additional search options
   */
  GEORADIUS,
  /**
   * Queries members in a geospatial index based on a radius from a center point
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param options - Additional search options
   */
  geoRadius: GEORADIUS,
  /**
   * Read-only variant that queries members in a geospatial index based on a radius from a member with additional information
   * @param key - Key of the geospatial index
   * @param from - Member name to use as center point
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param withValues - Information to include with each returned member
   */
  GEORADIUSBYMEMBER_RO_WITH,
  /**
   * Read-only variant that queries members in a geospatial index based on a radius from a member with additional information
   * @param key - Key of the geospatial index
   * @param from - Member name to use as center point
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param withValues - Information to include with each returned member
   */
  geoRadiusByMemberRoWith: GEORADIUSBYMEMBER_RO_WITH,
  /**
   * Read-only variant that queries members in a geospatial index based on a radius from a member
   * @param key - Key of the geospatial index
   * @param from - Member name to use as center point
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param options - Additional search options
   */
  GEORADIUSBYMEMBER_RO,
  /**
   * Read-only variant that queries members in a geospatial index based on a radius from a member
   * @param key - Key of the geospatial index
   * @param from - Member name to use as center point
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param options - Additional search options
   */
  geoRadiusByMemberRo: GEORADIUSBYMEMBER_RO,
  /**
   * Queries members in a geospatial index based on a radius from a member and stores the results
   * @param key - Key of the geospatial index
   * @param from - Member name to use as center point
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param destination - Key to store the results
   * @param options - Additional search and storage options
   */
  GEORADIUSBYMEMBER_STORE,
  /**
   * Queries members in a geospatial index based on a radius from a member and stores the results
   * @param key - Key of the geospatial index
   * @param from - Member name to use as center point
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param destination - Key to store the results
   * @param options - Additional search and storage options
   */
  geoRadiusByMemberStore: GEORADIUSBYMEMBER_STORE,
  /**
   * Queries members in a geospatial index based on a radius from a member with additional information
   * @param key - Key of the geospatial index
   * @param from - Member name to use as center point
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param replyWith - Information to include with each returned member
   * @param options - Additional search options
   */
  GEORADIUSBYMEMBER_WITH,
  /**
   * Queries members in a geospatial index based on a radius from a member with additional information
   * @param key - Key of the geospatial index
   * @param from - Member name to use as center point
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param replyWith - Information to include with each returned member
   * @param options - Additional search options
   */
  geoRadiusByMemberWith: GEORADIUSBYMEMBER_WITH,
  /**
   * Queries members in a geospatial index based on a radius from a member
   * @param key - Key of the geospatial index
   * @param from - Member name to use as center point
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param options - Additional search options
   */
  GEORADIUSBYMEMBER,
  /**
   * Queries members in a geospatial index based on a radius from a member
   * @param key - Key of the geospatial index
   * @param from - Member name to use as center point
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param options - Additional search options
   */
  geoRadiusByMember: GEORADIUSBYMEMBER,
  /**
   * Queries members inside an area of a geospatial index with additional information
   * @param key - Key of the geospatial index
   * @param from - Center point of the search (member name or coordinates)
   * @param by - Search area specification (radius or box dimensions)
   * @param replyWith - Information to include with each returned member
   * @param options - Additional search options
   */
  GEOSEARCH_WITH,
  /**
   * Queries members inside an area of a geospatial index with additional information
   * @param key - Key of the geospatial index
   * @param from - Center point of the search (member name or coordinates)
   * @param by - Search area specification (radius or box dimensions)
   * @param replyWith - Information to include with each returned member
   * @param options - Additional search options
   */
  geoSearchWith: GEOSEARCH_WITH,
  /**
   * Queries members inside an area of a geospatial index
   * @param key - Key of the geospatial index
   * @param from - Center point of the search (member name or coordinates)
   * @param by - Search area specification (radius or box dimensions)
   * @param options - Additional search options
   */
  GEOSEARCH,
  /**
   * Queries members inside an area of a geospatial index
   * @param key - Key of the geospatial index
   * @param from - Center point of the search (member name or coordinates)
   * @param by - Search area specification (radius or box dimensions)
   * @param options - Additional search options
   */
  geoSearch: GEOSEARCH,
  /**
   * Searches a geospatial index and stores the results in a new sorted set
   * @param destination - Key to store the results
   * @param source - Key of the geospatial index to search
   * @param from - Center point of the search (member name or coordinates)
   * @param by - Search area specification (radius or box dimensions)
   * @param options - Additional search and storage options
   */
  GEOSEARCHSTORE,
  /**
   * Searches a geospatial index and stores the results in a new sorted set
   * @param destination - Key to store the results
   * @param source - Key of the geospatial index to search
   * @param from - Center point of the search (member name or coordinates)
   * @param by - Search area specification (radius or box dimensions)
   * @param options - Additional search and storage options
   */
  geoSearchStore: GEOSEARCHSTORE,
  /**
   * Gets the value of a key
   * @param key - Key to get the value of
   */
  GET,
  /**
   * Gets the value of a key
   * @param key - Key to get the value of
   */
  get: GET,
  /**
   * Returns the bit value at a given offset in a string value
   * @param key - Key to retrieve the bit from
   * @param offset - Bit offset
   */
  GETBIT,
  /**
   * Returns the bit value at a given offset in a string value
   * @param key - Key to retrieve the bit from
   * @param offset - Bit offset
   */
  getBit: GETBIT,
  /**
   * Gets the value of a key and deletes the key
   * @param key - Key to get and delete
   */
  GETDEL,
  /**
   * Gets the value of a key and deletes the key
   * @param key - Key to get and delete
   */
  getDel: GETDEL,
  /**
   * Gets the value of a key and optionally sets its expiration
   * @param key - Key to get value from
   * @param options - Options for setting expiration
   */
  GETEX,
  /**
   * Gets the value of a key and optionally sets its expiration
   * @param key - Key to get value from
   * @param options - Options for setting expiration
   */
  getEx: GETEX,
  /**
   * Returns a substring of the string stored at a key
   * @param key - Key to get substring from
   * @param start - Start position of the substring
   * @param end - End position of the substring
   */
  GETRANGE,
  /**
   * Returns a substring of the string stored at a key
   * @param key - Key to get substring from
   * @param start - Start position of the substring
   * @param end - End position of the substring
   */
  getRange: GETRANGE,
  /**
   * Sets a key to a new value and returns its old value
   * @param key - Key to set
   * @param value - Value to set
   */
  GETSET,
  /**
   * Sets a key to a new value and returns its old value
   * @param key - Key to set
   * @param value - Value to set
   */
  getSet: GETSET,
  /**
   * Removes one or more fields from a hash
   * @param key - Key of the hash
   * @param field - Field(s) to remove
   */
  HDEL,
  /**
   * Removes one or more fields from a hash
   * @param key - Key of the hash
   * @param field - Field(s) to remove
   */
  hDel: HDEL,
  /**
   * Handshakes with the Redis server and switches to the specified protocol version
   * @param protover - Protocol version to use
   * @param options - Additional options for authentication and connection naming
   */
  HELLO,
  /**
   * Handshakes with the Redis server and switches to the specified protocol version
   * @param protover - Protocol version to use
   * @param options - Additional options for authentication and connection naming
   */
  hello: HELLO,
  /**
   * Determines whether a field exists in a hash
   * @param key - Key of the hash
   * @param field - Field to check
   */
  HEXISTS,
  /**
   * Determines whether a field exists in a hash
   * @param key - Key of the hash
   * @param field - Field to check
   */
  hExists: HEXISTS,
  /**
   * Sets a timeout on hash fields. After the timeout has expired, the fields will be automatically deleted
   * @param key - Key of the hash
   * @param fields - Fields to set expiration on
   * @param seconds - Number of seconds until field expiration
   * @param mode - Expiration mode: NX (only if field has no expiry), XX (only if field has existing expiry), GT (only if new expiry is greater than current), LT (only if new expiry is less than current)
   */
  HEXPIRE,
  /**
   * Sets a timeout on hash fields. After the timeout has expired, the fields will be automatically deleted
   * @param key - Key of the hash
   * @param fields - Fields to set expiration on
   * @param seconds - Number of seconds until field expiration
   * @param mode - Expiration mode: NX (only if field has no expiry), XX (only if field has existing expiry), GT (only if new expiry is greater than current), LT (only if new expiry is less than current)
   */
  hExpire: HEXPIRE,
  /**
   * Sets the expiration for hash fields at a specific Unix timestamp
   * @param key - Key of the hash
   * @param fields - Fields to set expiration on
   * @param timestamp - Unix timestamp (seconds since January 1, 1970) or Date object
   * @param mode - Expiration mode: NX (only if field has no expiry), XX (only if field has existing expiry), GT (only if new expiry is greater than current), LT (only if new expiry is less than current)
   */
  HEXPIREAT,
  /**
   * Sets the expiration for hash fields at a specific Unix timestamp
   * @param key - Key of the hash
   * @param fields - Fields to set expiration on
   * @param timestamp - Unix timestamp (seconds since January 1, 1970) or Date object
   * @param mode - Expiration mode: NX (only if field has no expiry), XX (only if field has existing expiry), GT (only if new expiry is greater than current), LT (only if new expiry is less than current)
   */
  hExpireAt: HEXPIREAT,
  /**
   * Returns the absolute Unix timestamp (since January 1, 1970) at which the given hash fields will expire
   * @param key - Key of the hash
   * @param fields - Fields to check expiration time
   */
  HEXPIRETIME,
  /**
   * Returns the absolute Unix timestamp (since January 1, 1970) at which the given hash fields will expire
   * @param key - Key of the hash
   * @param fields - Fields to check expiration time
   */
  hExpireTime: HEXPIRETIME,
  /**
   * Gets the value of a field in a hash
   * @param key - Key of the hash
   * @param field - Field to get the value of
   */
  HGET,
  /**
   * Gets the value of a field in a hash
   * @param key - Key of the hash
   * @param field - Field to get the value of
   */
  hGet: HGET,
  /**
   * Gets all fields and values in a hash
   * @param key - Key of the hash
   */
  HGETALL,
  /**
   * Gets all fields and values in a hash
   * @param key - Key of the hash
   */
  hGetAll: HGETALL,
  /**
   * Gets and deletes the specified fields from a hash
   * @param key - Key of the hash
   * @param fields - Fields to get and delete
   */
  HGETDEL,
  /**
   * Gets and deletes the specified fields from a hash
   * @param key - Key of the hash
   * @param fields - Fields to get and delete
   */
  hGetDel: HGETDEL,
  /**
   * Gets the values of the specified fields in a hash and optionally sets their expiration
   * @param key - Key of the hash
   * @param fields - Fields to get values from
   * @param options - Options for setting expiration
   */
  HGETEX,
  /**
   * Gets the values of the specified fields in a hash and optionally sets their expiration
   * @param key - Key of the hash
   * @param fields - Fields to get values from
   * @param options - Options for setting expiration
   */
  hGetEx: HGETEX,
  /**
   * Increments the integer value of a field in a hash by the given number
   * @param key - Key of the hash
   * @param field - Field to increment
   * @param increment - Increment amount
   */
  HINCRBY,
  /**
   * Increments the integer value of a field in a hash by the given number
   * @param key - Key of the hash
   * @param field - Field to increment
   * @param increment - Increment amount
   */
  hIncrBy: HINCRBY,
  /**
   * Increments the float value of a field in a hash by the given amount
   * @param key - Key of the hash
   * @param field - Field to increment
   * @param increment - Increment amount (float)
   */
  HINCRBYFLOAT,
  /**
   * Increments the float value of a field in a hash by the given amount
   * @param key - Key of the hash
   * @param field - Field to increment
   * @param increment - Increment amount (float)
   */
  hIncrByFloat: HINCRBYFLOAT,
  /**
   * Gets all field names in a hash
   * @param key - Key of the hash
   */
  HKEYS,
  /**
   * Gets all field names in a hash
   * @param key - Key of the hash
   */
  hKeys: HKEYS,
  /**
   * Gets the number of fields in a hash.
   * @param key - Key of the hash.
   */
  HLEN,
  /**
   * Gets the number of fields in a hash.
   * @param key - Key of the hash.
   */
  hLen: HLEN,
  /**
   * Gets the values of all the specified fields in a hash.
   * @param key - Key of the hash.
   * @param fields - Fields to get from the hash.
   */
  HMGET,
  /**
   * Gets the values of all the specified fields in a hash.
   * @param key - Key of the hash.
   * @param fields - Fields to get from the hash.
   */
  hmGet: HMGET,
  /**
   * Removes the expiration from the specified fields in a hash.
   * @param key - Key of the hash.
   * @param fields - Fields to remove expiration from.
   */
  HPERSIST,
  /**
   * Removes the expiration from the specified fields in a hash.
   * @param key - Key of the hash.
   * @param fields - Fields to remove expiration from.
   */
  hPersist: HPERSIST,
  /**
   * Parses the arguments for the `HPEXPIRE` command.
   *
   * @param key - The key of the hash.
   * @param fields - The fields to set the expiration for.
   * @param ms - The expiration time in milliseconds.
   * @param mode - Optional mode for the command ('NX', 'XX', 'GT', 'LT').
   */
  HPEXPIRE,
  /**
   * Parses the arguments for the `HPEXPIRE` command.
   *
   * @param key - The key of the hash.
   * @param fields - The fields to set the expiration for.
   * @param ms - The expiration time in milliseconds.
   * @param mode - Optional mode for the command ('NX', 'XX', 'GT', 'LT').
   */
  hpExpire: HPEXPIRE,
  /**
   * Parses the arguments for the `HPEXPIREAT` command.
   *
   * @param key - The key of the hash.
   * @param fields - The fields to set the expiration for.
   * @param timestamp - The expiration timestamp (Unix timestamp or Date object).
   * @param mode - Optional mode for the command ('NX', 'XX', 'GT', 'LT').
   */
  HPEXPIREAT,
  /**
   * Parses the arguments for the `HPEXPIREAT` command.
   *
   * @param key - The key of the hash.
   * @param fields - The fields to set the expiration for.
   * @param timestamp - The expiration timestamp (Unix timestamp or Date object).
   * @param mode - Optional mode for the command ('NX', 'XX', 'GT', 'LT').
   */
  hpExpireAt: HPEXPIREAT,
  /**
   * Constructs the HPEXPIRETIME command
   *
   * @param key - The key to retrieve expiration time for
   * @param fields - The fields to retrieve expiration time for
   * @see https://redis.io/commands/hpexpiretime/
   */
  HPEXPIRETIME,
  /**
   * Constructs the HPEXPIRETIME command
   *
   * @param key - The key to retrieve expiration time for
   * @param fields - The fields to retrieve expiration time for
   * @see https://redis.io/commands/hpexpiretime/
   */
  hpExpireTime: HPEXPIRETIME,
  /**
   * Constructs the HPTTL command
   *
   * @param key - The key to check time-to-live for
   * @param fields - The fields to check time-to-live for
   * @see https://redis.io/commands/hpttl/
   */
  HPTTL,
  /**
   * Constructs the HPTTL command
   *
   * @param key - The key to check time-to-live for
   * @param fields - The fields to check time-to-live for
   * @see https://redis.io/commands/hpttl/
   */
  hpTTL: HPTTL,
  /**
   * Constructs the HRANDFIELD command with count parameter and WITHVALUES option
   *
   * @param key - The key of the hash to get random fields from
   * @param count - The number of fields to return (positive: unique fields, negative: may repeat fields)
   * @see https://redis.io/commands/hrandfield/
   */
  HRANDFIELD_COUNT_WITHVALUES,
  /**
   * Constructs the HRANDFIELD command with count parameter and WITHVALUES option
   *
   * @param key - The key of the hash to get random fields from
   * @param count - The number of fields to return (positive: unique fields, negative: may repeat fields)
   * @see https://redis.io/commands/hrandfield/
   */
  hRandFieldCountWithValues: HRANDFIELD_COUNT_WITHVALUES,
  /**
   * Constructs the HRANDFIELD command with count parameter
   *
   * @param key - The key of the hash to get random fields from
   * @param count - The number of fields to return (positive: unique fields, negative: may repeat fields)
   * @see https://redis.io/commands/hrandfield/
   */
  HRANDFIELD_COUNT,
  /**
   * Constructs the HRANDFIELD command with count parameter
   *
   * @param key - The key of the hash to get random fields from
   * @param count - The number of fields to return (positive: unique fields, negative: may repeat fields)
   * @see https://redis.io/commands/hrandfield/
   */
  hRandFieldCount: HRANDFIELD_COUNT,
  /**
   * Constructs the HRANDFIELD command
   *
   * @param key - The key of the hash to get a random field from
   * @see https://redis.io/commands/hrandfield/
   */
  HRANDFIELD,
  /**
   * Constructs the HRANDFIELD command
   *
   * @param key - The key of the hash to get a random field from
   * @see https://redis.io/commands/hrandfield/
   */
  hRandField: HRANDFIELD,
  /**
   * Constructs the HSCAN command
   *
   * @param key - The key of the hash to scan
   * @param cursor - The cursor position to start scanning from
   * @param options - Options for the scan (COUNT, MATCH, TYPE)
   * @see https://redis.io/commands/hscan/
   */
  HSCAN,
  /**
   * Constructs the HSCAN command
   *
   * @param key - The key of the hash to scan
   * @param cursor - The cursor position to start scanning from
   * @param options - Options for the scan (COUNT, MATCH, TYPE)
   * @see https://redis.io/commands/hscan/
   */
  hScan: HSCAN,
  /**
   * Constructs the HSCAN command with NOVALUES option
   *
   * @param args - The same parameters as HSCAN command
   * @see https://redis.io/commands/hscan/
   */
  HSCAN_NOVALUES,
  /**
   * Constructs the HSCAN command with NOVALUES option
   *
   * @param args - The same parameters as HSCAN command
   * @see https://redis.io/commands/hscan/
   */
  hScanNoValues: HSCAN_NOVALUES,
  /**
   * Constructs the HSET command
   *
   * @param key - The key of the hash
   * @param value - Either the field name (when using single field) or an object/map/array of field-value pairs
   * @param fieldValue - The value to set (only used with single field variant)
   * @see https://redis.io/commands/hset/
   */
  HSET,
  /**
   * Constructs the HSET command
   *
   * @param key - The key of the hash
   * @param value - Either the field name (when using single field) or an object/map/array of field-value pairs
   * @param fieldValue - The value to set (only used with single field variant)
   * @see https://redis.io/commands/hset/
   */
  hSet: HSET,
  /**
   * Constructs the HSETEX command
   *
   * @param key - The key of the hash
   * @param fields - Object, Map, or Array of field-value pairs to set
   * @param options - Optional configuration for expiration and mode settings
   * @see https://redis.io/commands/hsetex/
   */
  HSETEX,
  /**
   * Constructs the HSETEX command
   *
   * @param key - The key of the hash
   * @param fields - Object, Map, or Array of field-value pairs to set
   * @param options - Optional configuration for expiration and mode settings
   * @see https://redis.io/commands/hsetex/
   */
  hSetEx: HSETEX,
  /**
   * Constructs the HSETNX command
   *
   * @param key - The key of the hash
   * @param field - The field to set if it does not exist
   * @param value - The value to set
   * @see https://redis.io/commands/hsetnx/
   */
  HSETNX,
  /**
   * Constructs the HSETNX command
   *
   * @param key - The key of the hash
   * @param field - The field to set if it does not exist
   * @param value - The value to set
   * @see https://redis.io/commands/hsetnx/
   */
  hSetNX: HSETNX,
  /**
   * Constructs the HSTRLEN command
   *
   * @param key - The key of the hash
   * @param field - The field to get the string length of
   * @see https://redis.io/commands/hstrlen/
   */
  HSTRLEN,
  /**
   * Constructs the HSTRLEN command
   *
   * @param key - The key of the hash
   * @param field - The field to get the string length of
   * @see https://redis.io/commands/hstrlen/
   */
  hStrLen: HSTRLEN,
  /**
   * Returns the remaining time to live of field(s) in a hash.
   * @param key - Key of the hash.
   * @param fields - Fields to check time to live.
   */
  HTTL,
  /**
   * Returns the remaining time to live of field(s) in a hash.
   * @param key - Key of the hash.
   * @param fields - Fields to check time to live.
   */
  hTTL: HTTL,
  /**
   * Gets all values in a hash.
   * @param key - Key of the hash.
   */
  HVALS,
  /**
   * Gets all values in a hash.
   * @param key - Key of the hash.
   */
  hVals: HVALS,
  /**
   * Returns the top K hotkeys by CPU time and network bytes.
   * Returns null if no tracking has been started or tracking was reset.
   * @see https://redis.io/commands/hotkeys-get/
   */
  HOTKEYS_GET,
  /**
   * Returns the top K hotkeys by CPU time and network bytes.
   * Returns null if no tracking has been started or tracking was reset.
   * @see https://redis.io/commands/hotkeys-get/
   */
  hotkeysGet: HOTKEYS_GET,
  /**
   * Releases resources used for hotkey tracking.
   * Returns error if a session is active (must be stopped first).
   * @see https://redis.io/commands/hotkeys-reset/
   */
  HOTKEYS_RESET,
  /**
   * Releases resources used for hotkey tracking.
   * Returns error if a session is active (must be stopped first).
   * @see https://redis.io/commands/hotkeys-reset/
   */
  hotkeysReset: HOTKEYS_RESET,
  /**
   * Starts hotkeys tracking with specified options.
   * @param options - Configuration options for hotkeys tracking
   * @see https://redis.io/commands/hotkeys-start/
   */
  HOTKEYS_START,
  /**
   * Starts hotkeys tracking with specified options.
   * @param options - Configuration options for hotkeys tracking
   * @see https://redis.io/commands/hotkeys-start/
   */
  hotkeysStart: HOTKEYS_START,
  /**
   * Stops hotkeys tracking. Results remain available via HOTKEYS GET.
   * Returns null if no session was started or is already stopped.
   * @see https://redis.io/commands/hotkeys-stop/
   */
  HOTKEYS_STOP,
  /**
   * Stops hotkeys tracking. Results remain available via HOTKEYS GET.
   * Returns null if no session was started or is already stopped.
   * @see https://redis.io/commands/hotkeys-stop/
   */
  hotkeysStop: HOTKEYS_STOP,
  /**
   * Constructs the INCR command
   *
   * @param key - The key to increment
   * @see https://redis.io/commands/incr/
   */
  INCR,
  /**
   * Constructs the INCR command
   *
   * @param key - The key to increment
   * @see https://redis.io/commands/incr/
   */
  incr: INCR,
  /**
   * Constructs the INCRBY command
   *
   * @param key - The key to increment
   * @param increment - The amount to increment by
   * @see https://redis.io/commands/incrby/
   */
  INCRBY,
  /**
   * Constructs the INCRBY command
   *
   * @param key - The key to increment
   * @param increment - The amount to increment by
   * @see https://redis.io/commands/incrby/
   */
  incrBy: INCRBY,
  /**
   * Constructs the INCRBYFLOAT command
   *
   * @param key - The key to increment
   * @param increment - The floating-point value to increment by
   * @see https://redis.io/commands/incrbyfloat/
   */
  INCRBYFLOAT,
  /**
   * Constructs the INCRBYFLOAT command
   *
   * @param key - The key to increment
   * @param increment - The floating-point value to increment by
   * @see https://redis.io/commands/incrbyfloat/
   */
  incrByFloat: INCRBYFLOAT,
  /**
   * Constructs the INFO command
   *
   * @param section - Optional specific section of information to retrieve
   * @see https://redis.io/commands/info/
   */
  INFO,
  /**
   * Constructs the INFO command
   *
   * @param section - Optional specific section of information to retrieve
   * @see https://redis.io/commands/info/
   */
  info: INFO,
  /**
   * Constructs the KEYS command
   *
   * @param pattern - The pattern to match keys against
   * @see https://redis.io/commands/keys/
   */
  KEYS,
  /**
   * Constructs the KEYS command
   *
   * @param pattern - The pattern to match keys against
   * @see https://redis.io/commands/keys/
   */
  keys: KEYS,
  /**
   * Constructs the LASTSAVE command
   *
   * @see https://redis.io/commands/lastsave/
   */
  LASTSAVE,
  /**
   * Constructs the LASTSAVE command
   *
   * @see https://redis.io/commands/lastsave/
   */
  lastSave: LASTSAVE,
  /**
   * Constructs the LATENCY DOCTOR command
   *
   * @see https://redis.io/commands/latency-doctor/
   */
  LATENCY_DOCTOR,
  /**
   * Constructs the LATENCY DOCTOR command
   *
   * @see https://redis.io/commands/latency-doctor/
   */
  latencyDoctor: LATENCY_DOCTOR,
  /**
   * Constructs the LATENCY GRAPH command
   *
   * @param event - The latency event to get the graph for
   * @see https://redis.io/commands/latency-graph/
   */
  LATENCY_GRAPH,
  /**
   * Constructs the LATENCY GRAPH command
   *
   * @param event - The latency event to get the graph for
   * @see https://redis.io/commands/latency-graph/
   */
  latencyGraph: LATENCY_GRAPH,
  /**
   * Constructs the LATENCY HISTORY command
   *
   * @param event - The latency event to get the history for
   * @see https://redis.io/commands/latency-history/
   */
  LATENCY_HISTORY,
  /**
   * Constructs the LATENCY HISTORY command
   *
   * @param event - The latency event to get the history for
   * @see https://redis.io/commands/latency-history/
   */
  latencyHistory: LATENCY_HISTORY,
  /**
   * Constructs the LATENCY HISTOGRAM command
   *
   * @param commands - The list of redis commands to get histogram for
   * @see https://redis.io/docs/latest/commands/latency-histogram/
   */
  LATENCY_HISTOGRAM,
  /**
   * Constructs the LATENCY HISTOGRAM command
   *
   * @param commands - The list of redis commands to get histogram for
   * @see https://redis.io/docs/latest/commands/latency-histogram/
   */
  latencyHistogram: LATENCY_HISTOGRAM,
  /**
   * Constructs the LATENCY LATEST command
   *
   * @see https://redis.io/commands/latency-latest/
   */
  LATENCY_LATEST,
  /**
   * Constructs the LATENCY LATEST command
   *
   * @see https://redis.io/commands/latency-latest/
   */
  latencyLatest: LATENCY_LATEST,
  /**
   * Constructs the LATENCY RESET command
   * @param events - The latency events to reset. If not specified, all events are reset.
   * @see https://redis.io/commands/latency-reset/
   */
  LATENCY_RESET,
  /**
   * Constructs the LATENCY RESET command
   * @param events - The latency events to reset. If not specified, all events are reset.
   * @see https://redis.io/commands/latency-reset/
   */
  latencyReset: LATENCY_RESET,
  /**
   * Constructs the LCS command with IDX and WITHMATCHLEN options
   *
   * @param args - The same parameters as LCS_IDX command
   * @see https://redis.io/commands/lcs/
   */
  LCS_IDX_WITHMATCHLEN,
  /**
   * Constructs the LCS command with IDX and WITHMATCHLEN options
   *
   * @param args - The same parameters as LCS_IDX command
   * @see https://redis.io/commands/lcs/
   */
  lcsIdxWithMatchLen: LCS_IDX_WITHMATCHLEN,
  /**
   * Constructs the LCS command with IDX option
   *
   * @param key1 - First key containing the first string
   * @param key2 - Second key containing the second string
   * @param options - Additional options for the LCS IDX command
   * @see https://redis.io/commands/lcs/
   */
  LCS_IDX,
  /**
   * Constructs the LCS command with IDX option
   *
   * @param key1 - First key containing the first string
   * @param key2 - Second key containing the second string
   * @param options - Additional options for the LCS IDX command
   * @see https://redis.io/commands/lcs/
   */
  lcsIdx: LCS_IDX,
  /**
   * Constructs the LCS command with LEN option
   *
   * @param args - The same parameters as LCS command
   * @see https://redis.io/commands/lcs/
   */
  LCS_LEN,
  /**
   * Constructs the LCS command with LEN option
   *
   * @param args - The same parameters as LCS command
   * @see https://redis.io/commands/lcs/
   */
  lcsLen: LCS_LEN,
  /**
   * Constructs the LCS command (Longest Common Substring)
   *
   * @param key1 - First key containing the first string
   * @param key2 - Second key containing the second string
   * @see https://redis.io/commands/lcs/
   */
  LCS,
  /**
   * Constructs the LCS command (Longest Common Substring)
   *
   * @param key1 - First key containing the first string
   * @param key2 - Second key containing the second string
   * @see https://redis.io/commands/lcs/
   */
  lcs: LCS,
  /**
   * Constructs the LINDEX command
   *
   * @param key - The key of the list
   * @param index - The index of the element to retrieve
   * @see https://redis.io/commands/lindex/
   */
  LINDEX,
  /**
   * Constructs the LINDEX command
   *
   * @param key - The key of the list
   * @param index - The index of the element to retrieve
   * @see https://redis.io/commands/lindex/
   */
  lIndex: LINDEX,
  /**
   * Constructs the LINSERT command
   *
   * @param key - The key of the list
   * @param position - The position where to insert (BEFORE or AFTER)
   * @param pivot - The element to find in the list
   * @param element - The element to insert
   * @see https://redis.io/commands/linsert/
   */
  LINSERT,
  /**
   * Constructs the LINSERT command
   *
   * @param key - The key of the list
   * @param position - The position where to insert (BEFORE or AFTER)
   * @param pivot - The element to find in the list
   * @param element - The element to insert
   * @see https://redis.io/commands/linsert/
   */
  lInsert: LINSERT,
  /**
   * Constructs the LLEN command
   *
   * @param key - The key of the list to get the length of
   * @see https://redis.io/commands/llen/
   */
  LLEN,
  /**
   * Constructs the LLEN command
   *
   * @param key - The key of the list to get the length of
   * @see https://redis.io/commands/llen/
   */
  lLen: LLEN,
  /**
   * Constructs the LMOVE command
   *
   * @param source - The source list key
   * @param destination - The destination list key
   * @param sourceSide - The side to pop from (LEFT or RIGHT)
   * @param destinationSide - The side to push to (LEFT or RIGHT)
   * @see https://redis.io/commands/lmove/
   */
  LMOVE,
  /**
   * Constructs the LMOVE command
   *
   * @param source - The source list key
   * @param destination - The destination list key
   * @param sourceSide - The side to pop from (LEFT or RIGHT)
   * @param destinationSide - The side to push to (LEFT or RIGHT)
   * @see https://redis.io/commands/lmove/
   */
  lMove: LMOVE,
  /**
   * Constructs the LMPOP command
   *
   * @param args - Arguments including keys, side (LEFT or RIGHT), and options
   * @see https://redis.io/commands/lmpop/
   */
  LMPOP,
  /**
   * Constructs the LMPOP command
   *
   * @param args - Arguments including keys, side (LEFT or RIGHT), and options
   * @see https://redis.io/commands/lmpop/
   */
  lmPop: LMPOP,
  /**
   * Constructs the LOLWUT command
   *
   * @param version - Optional version parameter
   * @param optionalArguments - Additional optional numeric arguments
   * @see https://redis.io/commands/lolwut/
   */
  LOLWUT,
  /**
   * Constructs the LPOP command with count parameter
   *
   * @param key - The key of the list to pop from
   * @param count - The number of elements to pop
   * @see https://redis.io/commands/lpop/
   */
  LPOP_COUNT,
  /**
   * Constructs the LPOP command with count parameter
   *
   * @param key - The key of the list to pop from
   * @param count - The number of elements to pop
   * @see https://redis.io/commands/lpop/
   */
  lPopCount: LPOP_COUNT,
  /**
   * Constructs the LPOP command
   *
   * @param key - The key of the list to pop from
   * @see https://redis.io/commands/lpop/
   */
  LPOP,
  /**
   * Constructs the LPOP command
   *
   * @param key - The key of the list to pop from
   * @see https://redis.io/commands/lpop/
   */
  lPop: LPOP,
  /**
   * Constructs the LPOS command with COUNT option
   *
   * @param key - The key of the list
   * @param element - The element to search for
   * @param count - The number of positions to return
   * @param options - Optional parameters for RANK and MAXLEN
   * @see https://redis.io/commands/lpos/
   */
  LPOS_COUNT,
  /**
   * Constructs the LPOS command with COUNT option
   *
   * @param key - The key of the list
   * @param element - The element to search for
   * @param count - The number of positions to return
   * @param options - Optional parameters for RANK and MAXLEN
   * @see https://redis.io/commands/lpos/
   */
  lPosCount: LPOS_COUNT,
  /**
   * Constructs the LPOS command
   *
   * @param key - The key of the list
   * @param element - The element to search for
   * @param options - Optional parameters for RANK and MAXLEN
   * @see https://redis.io/commands/lpos/
   */
  LPOS,
  /**
   * Constructs the LPOS command
   *
   * @param key - The key of the list
   * @param element - The element to search for
   * @param options - Optional parameters for RANK and MAXLEN
   * @see https://redis.io/commands/lpos/
   */
  lPos: LPOS,
  /**
   * Constructs the LPUSH command
   *
   * @param key - The key of the list
   * @param elements - One or more elements to push to the list
   * @see https://redis.io/commands/lpush/
   */
  LPUSH,
  /**
   * Constructs the LPUSH command
   *
   * @param key - The key of the list
   * @param elements - One or more elements to push to the list
   * @see https://redis.io/commands/lpush/
   */
  lPush: LPUSH,
  /**
   * Constructs the LPUSHX command
   *
   * @param key - The key of the list
   * @param elements - One or more elements to push to the list if it exists
   * @see https://redis.io/commands/lpushx/
   */
  LPUSHX,
  /**
   * Constructs the LPUSHX command
   *
   * @param key - The key of the list
   * @param elements - One or more elements to push to the list if it exists
   * @see https://redis.io/commands/lpushx/
   */
  lPushX: LPUSHX,
  /**
   * Constructs the LRANGE command
   *
   * @param key - The key of the list
   * @param start - The starting index
   * @param stop - The ending index
   * @see https://redis.io/commands/lrange/
   */
  LRANGE,
  /**
   * Constructs the LRANGE command
   *
   * @param key - The key of the list
   * @param start - The starting index
   * @param stop - The ending index
   * @see https://redis.io/commands/lrange/
   */
  lRange: LRANGE,
  /**
   * Constructs the LREM command
   *
   * @param key - The key of the list
   * @param count - The count of elements to remove (negative: from tail to head, 0: all occurrences, positive: from head to tail)
   * @param element - The element to remove
   * @see https://redis.io/commands/lrem/
   */
  LREM,
  /**
   * Constructs the LREM command
   *
   * @param key - The key of the list
   * @param count - The count of elements to remove (negative: from tail to head, 0: all occurrences, positive: from head to tail)
   * @param element - The element to remove
   * @see https://redis.io/commands/lrem/
   */
  lRem: LREM,
  /**
   * Constructs the LSET command
   *
   * @param key - The key of the list
   * @param index - The index of the element to replace
   * @param element - The new value to set
   * @see https://redis.io/commands/lset/
   */
  LSET,
  /**
   * Constructs the LSET command
   *
   * @param key - The key of the list
   * @param index - The index of the element to replace
   * @param element - The new value to set
   * @see https://redis.io/commands/lset/
   */
  lSet: LSET,
  /**
   * Constructs the LTRIM command
   *
   * @param key - The key of the list
   * @param start - The starting index
   * @param stop - The ending index
   * @see https://redis.io/commands/ltrim/
   */
  LTRIM,
  /**
   * Constructs the LTRIM command
   *
   * @param key - The key of the list
   * @param start - The starting index
   * @param stop - The ending index
   * @see https://redis.io/commands/ltrim/
   */
  lTrim: LTRIM,
  /**
   * Constructs the MEMORY DOCTOR command
   *
   * @see https://redis.io/commands/memory-doctor/
   */
  MEMORY_DOCTOR,
  /**
   * Constructs the MEMORY DOCTOR command
   *
   * @see https://redis.io/commands/memory-doctor/
   */
  memoryDoctor: MEMORY_DOCTOR,
  /**
   * Constructs the MEMORY MALLOC-STATS command
   *
   * @see https://redis.io/commands/memory-malloc-stats/
   */
  'MEMORY_MALLOC-STATS': MEMORY_MALLOC_STATS,
  /**
   * Constructs the MEMORY MALLOC-STATS command
   *
   * @see https://redis.io/commands/memory-malloc-stats/
   */
  memoryMallocStats: MEMORY_MALLOC_STATS,
  /**
   * Constructs the MEMORY PURGE command
   *
   * @see https://redis.io/commands/memory-purge/
   */
  MEMORY_PURGE,
  /**
   * Constructs the MEMORY PURGE command
   *
   * @see https://redis.io/commands/memory-purge/
   */
  memoryPurge: MEMORY_PURGE,
  /**
   * Constructs the MEMORY STATS command
   *
   * @see https://redis.io/commands/memory-stats/
   */
  MEMORY_STATS,
  /**
   * Constructs the MEMORY STATS command
   *
   * @see https://redis.io/commands/memory-stats/
   */
  memoryStats: MEMORY_STATS,
  /**
   * Constructs the MEMORY USAGE command
   *
   * @param key - The key to get memory usage for
   * @param options - Optional parameters including SAMPLES
   * @see https://redis.io/commands/memory-usage/
   */
  MEMORY_USAGE,
  /**
   * Constructs the MEMORY USAGE command
   *
   * @param key - The key to get memory usage for
   * @param options - Optional parameters including SAMPLES
   * @see https://redis.io/commands/memory-usage/
   */
  memoryUsage: MEMORY_USAGE,
  /**
   * Constructs the MGET command
   *
   * @param keys - Array of keys to get
   * @see https://redis.io/commands/mget/
   */
  MGET,
  /**
   * Constructs the MGET command
   *
   * @param keys - Array of keys to get
   * @see https://redis.io/commands/mget/
   */
  mGet: MGET,
  /**
   * Constructs the MIGRATE command
   *
   * @param host - Target Redis instance host
   * @param port - Target Redis instance port
   * @param key - Key or keys to migrate
   * @param destinationDb - Target database index
   * @param timeout - Timeout in milliseconds
   * @param options - Optional parameters including COPY, REPLACE, and AUTH
   * @see https://redis.io/commands/migrate/
   */
  MIGRATE,
  /**
   * Constructs the MIGRATE command
   *
   * @param host - Target Redis instance host
   * @param port - Target Redis instance port
   * @param key - Key or keys to migrate
   * @param destinationDb - Target database index
   * @param timeout - Timeout in milliseconds
   * @param options - Optional parameters including COPY, REPLACE, and AUTH
   * @see https://redis.io/commands/migrate/
   */
  migrate: MIGRATE,
  /**
   * Constructs the MODULE LIST command
   *
   * @see https://redis.io/commands/module-list/
   */
  MODULE_LIST,
  /**
   * Constructs the MODULE LIST command
   *
   * @see https://redis.io/commands/module-list/
   */
  moduleList: MODULE_LIST,
  /**
   * Constructs the MODULE LOAD command
   *
   * @param path - Path to the module file
   * @param moduleArguments - Optional arguments to pass to the module
   * @see https://redis.io/commands/module-load/
   */
  MODULE_LOAD,
  /**
   * Constructs the MODULE LOAD command
   *
   * @param path - Path to the module file
   * @param moduleArguments - Optional arguments to pass to the module
   * @see https://redis.io/commands/module-load/
   */
  moduleLoad: MODULE_LOAD,
  /**
   * Constructs the MODULE UNLOAD command
   *
   * @param name - The name of the module to unload
   * @see https://redis.io/commands/module-unload/
   */
  MODULE_UNLOAD,
  /**
   * Constructs the MODULE UNLOAD command
   *
   * @param name - The name of the module to unload
   * @see https://redis.io/commands/module-unload/
   */
  moduleUnload: MODULE_UNLOAD,
  /**
   * Constructs the MOVE command
   *
   * @param key - The key to move
   * @param db - The destination database index
   * @see https://redis.io/commands/move/
   */
  MOVE,
  /**
   * Constructs the MOVE command
   *
   * @param key - The key to move
   * @param db - The destination database index
   * @see https://redis.io/commands/move/
   */
  move: MOVE,
  /**
   * Constructs the MSET command
   *
   * @param toSet - Key-value pairs to set (array of tuples, flat array, or object)
   * @see https://redis.io/commands/mset/
   */
  MSET,
  /**
   * Constructs the MSET command
   *
   * @param toSet - Key-value pairs to set (array of tuples, flat array, or object)
   * @see https://redis.io/commands/mset/
   */
  mSet: MSET,
  /**
   * Constructs the MSETEX command.
   *
   * Atomically sets multiple string keys with a shared expiration in a single operation.
   *
   * @param keyValuePairs - Key-value pairs to set (array of tuples, flat array, or object)
   * @param options - Configuration for expiration and set modes
   * @see https://redis.io/commands/msetex/
   */
  MSETEX,
  /**
   * Constructs the MSETEX command.
   *
   * Atomically sets multiple string keys with a shared expiration in a single operation.
   *
   * @param keyValuePairs - Key-value pairs to set (array of tuples, flat array, or object)
   * @param options - Configuration for expiration and set modes
   * @see https://redis.io/commands/msetex/
   */
  mSetEx: MSETEX,
  /**
   * Constructs the MSETNX command
   *
   * @param toSet - Key-value pairs to set if none of the keys exist (array of tuples, flat array, or object)
   * @see https://redis.io/commands/msetnx/
   */
  MSETNX,
  /**
   * Constructs the MSETNX command
   *
   * @param toSet - Key-value pairs to set if none of the keys exist (array of tuples, flat array, or object)
   * @see https://redis.io/commands/msetnx/
   */
  mSetNX: MSETNX,
  /**
   * Constructs the OBJECT ENCODING command
   *
   * @param key - The key to get the internal encoding for
   * @see https://redis.io/commands/object-encoding/
   */
  OBJECT_ENCODING,
  /**
   * Constructs the OBJECT ENCODING command
   *
   * @param key - The key to get the internal encoding for
   * @see https://redis.io/commands/object-encoding/
   */
  objectEncoding: OBJECT_ENCODING,
  /**
   * Constructs the OBJECT FREQ command
   *
   * @param key - The key to get the access frequency for
   * @see https://redis.io/commands/object-freq/
   */
  OBJECT_FREQ,
  /**
   * Constructs the OBJECT FREQ command
   *
   * @param key - The key to get the access frequency for
   * @see https://redis.io/commands/object-freq/
   */
  objectFreq: OBJECT_FREQ,
  /**
   * Constructs the OBJECT IDLETIME command
   *
   * @param key - The key to get the idle time for
   * @see https://redis.io/commands/object-idletime/
   */
  OBJECT_IDLETIME,
  /**
   * Constructs the OBJECT IDLETIME command
   *
   * @param key - The key to get the idle time for
   * @see https://redis.io/commands/object-idletime/
   */
  objectIdleTime: OBJECT_IDLETIME,
  /**
   * Constructs the OBJECT REFCOUNT command
   *
   * @param key - The key to get the reference count for
   * @see https://redis.io/commands/object-refcount/
   */
  OBJECT_REFCOUNT,
  /**
   * Constructs the OBJECT REFCOUNT command
   *
   * @param key - The key to get the reference count for
   * @see https://redis.io/commands/object-refcount/
   */
  objectRefCount: OBJECT_REFCOUNT,
  /**
   * Constructs the PERSIST command
   *
   * @param key - The key to remove the expiration from
   * @see https://redis.io/commands/persist/
   */
  PERSIST,
  /**
   * Constructs the PERSIST command
   *
   * @param key - The key to remove the expiration from
   * @see https://redis.io/commands/persist/
   */
  persist: PERSIST,
  /**
   * Constructs the PEXPIRE command
   *
   * @param key - The key to set the expiration for
   * @param ms - The expiration time in milliseconds
   * @param mode - Optional mode for the command ('NX', 'XX', 'GT', 'LT')
   * @see https://redis.io/commands/pexpire/
   */
  PEXPIRE,
  /**
   * Constructs the PEXPIRE command
   *
   * @param key - The key to set the expiration for
   * @param ms - The expiration time in milliseconds
   * @param mode - Optional mode for the command ('NX', 'XX', 'GT', 'LT')
   * @see https://redis.io/commands/pexpire/
   */
  pExpire: PEXPIRE,
  /**
   * Constructs the PEXPIREAT command
   *
   * @param key - The key to set the expiration for
   * @param msTimestamp - The expiration timestamp in milliseconds (Unix timestamp or Date object)
   * @param mode - Optional mode for the command ('NX', 'XX', 'GT', 'LT')
   * @see https://redis.io/commands/pexpireat/
   */
  PEXPIREAT,
  /**
   * Constructs the PEXPIREAT command
   *
   * @param key - The key to set the expiration for
   * @param msTimestamp - The expiration timestamp in milliseconds (Unix timestamp or Date object)
   * @param mode - Optional mode for the command ('NX', 'XX', 'GT', 'LT')
   * @see https://redis.io/commands/pexpireat/
   */
  pExpireAt: PEXPIREAT,
  /**
   * Constructs the PEXPIRETIME command
   *
   * @param key - The key to get the expiration time for in milliseconds
   * @see https://redis.io/commands/pexpiretime/
   */
  PEXPIRETIME,
  /**
   * Constructs the PEXPIRETIME command
   *
   * @param key - The key to get the expiration time for in milliseconds
   * @see https://redis.io/commands/pexpiretime/
   */
  pExpireTime: PEXPIRETIME,
  /**
   * Constructs the PFADD command
   *
   * @param key - The key of the HyperLogLog
   * @param element - Optional elements to add
   * @see https://redis.io/commands/pfadd/
   */
  PFADD,
  /**
   * Constructs the PFADD command
   *
   * @param key - The key of the HyperLogLog
   * @param element - Optional elements to add
   * @see https://redis.io/commands/pfadd/
   */
  pfAdd: PFADD,
  /**
   * Constructs the PFCOUNT command
   *
   * @param keys - One or more keys of HyperLogLog structures to count
   * @see https://redis.io/commands/pfcount/
   */
  PFCOUNT,
  /**
   * Constructs the PFCOUNT command
   *
   * @param keys - One or more keys of HyperLogLog structures to count
   * @see https://redis.io/commands/pfcount/
   */
  pfCount: PFCOUNT,
  /**
   * Constructs the PFMERGE command
   *
   * @param destination - The destination key to merge to
   * @param sources - One or more source keys to merge from
   * @see https://redis.io/commands/pfmerge/
   */
  PFMERGE,
  /**
   * Constructs the PFMERGE command
   *
   * @param destination - The destination key to merge to
   * @param sources - One or more source keys to merge from
   * @see https://redis.io/commands/pfmerge/
   */
  pfMerge: PFMERGE,
  /**
   * Constructs the PING command
   *
   * @param message - Optional message to be returned instead of PONG
   * @see https://redis.io/commands/ping/
   */
  PING,
  /**
   * Constructs the PING command
   *
   * @param message - Optional message to be returned instead of PONG
   * @see https://redis.io/commands/ping/
   */
  ping: PING,
  /**
   * Constructs the PSETEX command
   *
   * @param key - The key to set
   * @param ms - The expiration time in milliseconds
   * @param value - The value to set
   * @see https://redis.io/commands/psetex/
   */
  PSETEX,
  /**
   * Constructs the PSETEX command
   *
   * @param key - The key to set
   * @param ms - The expiration time in milliseconds
   * @param value - The value to set
   * @see https://redis.io/commands/psetex/
   */
  pSetEx: PSETEX,
  /**
   * Constructs the PTTL command
   *
   * @param key - The key to get the time to live in milliseconds
   * @see https://redis.io/commands/pttl/
   */
  PTTL,
  /**
   * Constructs the PTTL command
   *
   * @param key - The key to get the time to live in milliseconds
   * @see https://redis.io/commands/pttl/
   */
  pTTL: PTTL,
  /**
   * Constructs the PUBLISH command
   *
   * @param channel - The channel to publish to
   * @param message - The message to publish
   * @see https://redis.io/commands/publish/
   */
  PUBLISH,
  /**
   * Constructs the PUBLISH command
   *
   * @param channel - The channel to publish to
   * @param message - The message to publish
   * @see https://redis.io/commands/publish/
   */
  publish: PUBLISH,
  /**
   * Constructs the PUBSUB CHANNELS command
   *
   * @param pattern - Optional pattern to filter channels
   * @see https://redis.io/commands/pubsub-channels/
   */
  PUBSUB_CHANNELS,
  /**
   * Constructs the PUBSUB CHANNELS command
   *
   * @param pattern - Optional pattern to filter channels
   * @see https://redis.io/commands/pubsub-channels/
   */
  pubSubChannels: PUBSUB_CHANNELS,
  /**
   * Constructs the PUBSUB NUMPAT command
   *
   * @see https://redis.io/commands/pubsub-numpat/
   */
  PUBSUB_NUMPAT,
  /**
   * Constructs the PUBSUB NUMPAT command
   *
   * @see https://redis.io/commands/pubsub-numpat/
   */
  pubSubNumPat: PUBSUB_NUMPAT,
  /**
   * Constructs the PUBSUB NUMSUB command
   *
   * @param channels - Optional channel names to get subscription count for
   * @see https://redis.io/commands/pubsub-numsub/
   */
  PUBSUB_NUMSUB,
  /**
   * Constructs the PUBSUB NUMSUB command
   *
   * @param channels - Optional channel names to get subscription count for
   * @see https://redis.io/commands/pubsub-numsub/
   */
  pubSubNumSub: PUBSUB_NUMSUB,
  /**
   * Constructs the PUBSUB SHARDNUMSUB command
   *
   * @param channels - Optional shard channel names to get subscription count for
   * @see https://redis.io/commands/pubsub-shardnumsub/
   */
  PUBSUB_SHARDNUMSUB,
  /**
   * Constructs the PUBSUB SHARDNUMSUB command
   *
   * @param channels - Optional shard channel names to get subscription count for
   * @see https://redis.io/commands/pubsub-shardnumsub/
   */
  pubSubShardNumSub: PUBSUB_SHARDNUMSUB,
  /**
   * Constructs the PUBSUB SHARDCHANNELS command
   *
   * @param pattern - Optional pattern to filter shard channels
   * @see https://redis.io/commands/pubsub-shardchannels/
   */
  PUBSUB_SHARDCHANNELS,
  /**
   * Constructs the PUBSUB SHARDCHANNELS command
   *
   * @param pattern - Optional pattern to filter shard channels
   * @see https://redis.io/commands/pubsub-shardchannels/
   */
  pubSubShardChannels: PUBSUB_SHARDCHANNELS,
  /**
   * Constructs the RANDOMKEY command
   *
   * @see https://redis.io/commands/randomkey/
   */
  RANDOMKEY,
  /**
   * Constructs the RANDOMKEY command
   *
   * @see https://redis.io/commands/randomkey/
   */
  randomKey: RANDOMKEY,
  /**
   * Constructs the READONLY command
   *
   * @see https://redis.io/commands/readonly/
   */
  READONLY,
  /**
   * Constructs the READONLY command
   *
   * @see https://redis.io/commands/readonly/
   */
  readonly: READONLY,
  /**
   * Constructs the RENAME command
   *
   * @param key - The key to rename
   * @param newKey - The new key name
   * @see https://redis.io/commands/rename/
   */
  RENAME,
  /**
   * Constructs the RENAME command
   *
   * @param key - The key to rename
   * @param newKey - The new key name
   * @see https://redis.io/commands/rename/
   */
  rename: RENAME,
  /**
   * Constructs the RENAMENX command
   *
   * @param key - The key to rename
   * @param newKey - The new key name, if it doesn't exist
   * @see https://redis.io/commands/renamenx/
   */
  RENAMENX,
  /**
   * Constructs the RENAMENX command
   *
   * @param key - The key to rename
   * @param newKey - The new key name, if it doesn't exist
   * @see https://redis.io/commands/renamenx/
   */
  renameNX: RENAMENX,
  /**
   * Constructs the REPLICAOF command
   *
   * @param host - The host of the master to replicate from
   * @param port - The port of the master to replicate from
   * @see https://redis.io/commands/replicaof/
   */
  REPLICAOF,
  /**
   * Constructs the REPLICAOF command
   *
   * @param host - The host of the master to replicate from
   * @param port - The port of the master to replicate from
   * @see https://redis.io/commands/replicaof/
   */
  replicaOf: REPLICAOF,
  /**
   * Constructs the RESTORE-ASKING command
   *
   * @see https://redis.io/commands/restore-asking/
   */
  'RESTORE-ASKING': RESTORE_ASKING,
  /**
   * Constructs the RESTORE-ASKING command
   *
   * @see https://redis.io/commands/restore-asking/
   */
  restoreAsking: RESTORE_ASKING,
  /**
   * Constructs the RESTORE command
   *
   * @param key - The key to restore
   * @param ttl - Time to live in milliseconds, 0 for no expiry
   * @param serializedValue - The serialized value from DUMP command
   * @param options - Options for the RESTORE command
   * @see https://redis.io/commands/restore/
   */
  RESTORE,
  /**
   * Constructs the RESTORE command
   *
   * @param key - The key to restore
   * @param ttl - Time to live in milliseconds, 0 for no expiry
   * @param serializedValue - The serialized value from DUMP command
   * @param options - Options for the RESTORE command
   * @see https://redis.io/commands/restore/
   */
  restore: RESTORE,
  /**
   * Constructs the RPOP command with count parameter
   *
   * @param key - The list key to pop from
   * @param count - The number of elements to pop
   * @see https://redis.io/commands/rpop/
   */
  RPOP_COUNT,
  /**
   * Constructs the RPOP command with count parameter
   *
   * @param key - The list key to pop from
   * @param count - The number of elements to pop
   * @see https://redis.io/commands/rpop/
   */
  rPopCount: RPOP_COUNT,
  /**
   * Constructs the ROLE command
   *
   * @see https://redis.io/commands/role/
   */
  ROLE,
  /**
   * Constructs the ROLE command
   *
   * @see https://redis.io/commands/role/
   */
  role: ROLE,
  /**
   * Constructs the RPOP command
   *
   * @param key - The list key to pop from
   * @see https://redis.io/commands/rpop/
   */
  RPOP,
  /**
   * Constructs the RPOP command
   *
   * @param key - The list key to pop from
   * @see https://redis.io/commands/rpop/
   */
  rPop: RPOP,
  /**
   * Constructs the RPOPLPUSH command
   *
   * @param source - The source list key
   * @param destination - The destination list key
   * @see https://redis.io/commands/rpoplpush/
   */
  RPOPLPUSH,
  /**
   * Constructs the RPOPLPUSH command
   *
   * @param source - The source list key
   * @param destination - The destination list key
   * @see https://redis.io/commands/rpoplpush/
   */
  rPopLPush: RPOPLPUSH,
  /**
   * Constructs the RPUSH command
   *
   * @param key - The list key to push to
   * @param element - One or more elements to push
   * @see https://redis.io/commands/rpush/
   */
  RPUSH,
  /**
   * Constructs the RPUSH command
   *
   * @param key - The list key to push to
   * @param element - One or more elements to push
   * @see https://redis.io/commands/rpush/
   */
  rPush: RPUSH,
  /**
   * Constructs the RPUSHX command
   *
   * @param key - The list key to push to (only if it exists)
   * @param element - One or more elements to push
   * @see https://redis.io/commands/rpushx/
   */
  RPUSHX,
  /**
   * Constructs the RPUSHX command
   *
   * @param key - The list key to push to (only if it exists)
   * @param element - One or more elements to push
   * @see https://redis.io/commands/rpushx/
   */
  rPushX: RPUSHX,
  /**
   * Constructs the SADD command
   *
   * @param key - The set key to add members to
   * @param members - One or more members to add to the set
   * @see https://redis.io/commands/sadd/
   */
  SADD,
  /**
   * Constructs the SADD command
   *
   * @param key - The set key to add members to
   * @param members - One or more members to add to the set
   * @see https://redis.io/commands/sadd/
   */
  sAdd: SADD,
  /**
   * Constructs the SCAN command
   *
   * @param cursor - The cursor position to start scanning from
   * @param options - Scan options
   * @see https://redis.io/commands/scan/
   */
  SCAN,
  /**
   * Constructs the SCAN command
   *
   * @param cursor - The cursor position to start scanning from
   * @param options - Scan options
   * @see https://redis.io/commands/scan/
   */
  scan: SCAN,
  /**
   * Constructs the SCARD command
   *
   * @param key - The set key to get the cardinality of
   * @see https://redis.io/commands/scard/
   */
  SCARD,
  /**
   * Constructs the SCARD command
   *
   * @param key - The set key to get the cardinality of
   * @see https://redis.io/commands/scard/
   */
  sCard: SCARD,
  /**
   * Constructs the SCRIPT DEBUG command
   *
   * @param mode - Debug mode: YES, SYNC, or NO
   * @see https://redis.io/commands/script-debug/
   */
  SCRIPT_DEBUG,
  /**
   * Constructs the SCRIPT DEBUG command
   *
   * @param mode - Debug mode: YES, SYNC, or NO
   * @see https://redis.io/commands/script-debug/
   */
  scriptDebug: SCRIPT_DEBUG,
  /**
   * Constructs the SCRIPT EXISTS command
   *
   * @param sha1 - One or more SHA1 digests of scripts
   * @see https://redis.io/commands/script-exists/
   */
  SCRIPT_EXISTS,
  /**
   * Constructs the SCRIPT EXISTS command
   *
   * @param sha1 - One or more SHA1 digests of scripts
   * @see https://redis.io/commands/script-exists/
   */
  scriptExists: SCRIPT_EXISTS,
  /**
   * Constructs the SCRIPT FLUSH command
   *
   * @param mode - Optional flush mode: ASYNC or SYNC
   * @see https://redis.io/commands/script-flush/
   */
  SCRIPT_FLUSH,
  /**
   * Constructs the SCRIPT FLUSH command
   *
   * @param mode - Optional flush mode: ASYNC or SYNC
   * @see https://redis.io/commands/script-flush/
   */
  scriptFlush: SCRIPT_FLUSH,
  /**
   * Constructs the SCRIPT KILL command
   *
   * @see https://redis.io/commands/script-kill/
   */
  SCRIPT_KILL,
  /**
   * Constructs the SCRIPT KILL command
   *
   * @see https://redis.io/commands/script-kill/
   */
  scriptKill: SCRIPT_KILL,
  /**
   * Constructs the SCRIPT LOAD command
   *
   * @param script - The Lua script to load
   * @see https://redis.io/commands/script-load/
   */
  SCRIPT_LOAD,
  /**
   * Constructs the SCRIPT LOAD command
   *
   * @param script - The Lua script to load
   * @see https://redis.io/commands/script-load/
   */
  scriptLoad: SCRIPT_LOAD,
  /**
   * Constructs the SDIFF command
   *
   * @param keys - One or more set keys to compute the difference from
   * @see https://redis.io/commands/sdiff/
   */
  SDIFF,
  /**
   * Constructs the SDIFF command
   *
   * @param keys - One or more set keys to compute the difference from
   * @see https://redis.io/commands/sdiff/
   */
  sDiff: SDIFF,
  /**
   * Constructs the SDIFFSTORE command
   *
   * @param destination - The destination key to store the result
   * @param keys - One or more set keys to compute the difference from
   * @see https://redis.io/commands/sdiffstore/
   */
  SDIFFSTORE,
  /**
   * Constructs the SDIFFSTORE command
   *
   * @param destination - The destination key to store the result
   * @param keys - One or more set keys to compute the difference from
   * @see https://redis.io/commands/sdiffstore/
   */
  sDiffStore: SDIFFSTORE,
  /**
   * Constructs the SET command
   *
   * @param key - The key to set
   * @param value - The value to set
   * @param options - Additional options for the SET command
   * @see https://redis.io/commands/set/
   */
  SET,
  /**
   * Constructs the SET command
   *
   * @param key - The key to set
   * @param value - The value to set
   * @param options - Additional options for the SET command
   * @see https://redis.io/commands/set/
   */
  set: SET,
  /**
   * Constructs the SETBIT command
   *
   * @param key - The key to set the bit on
   * @param offset - The bit offset (zero-based)
   * @param value - The bit value (0 or 1)
   * @see https://redis.io/commands/setbit/
   */
  SETBIT,
  /**
   * Constructs the SETBIT command
   *
   * @param key - The key to set the bit on
   * @param offset - The bit offset (zero-based)
   * @param value - The bit value (0 or 1)
   * @see https://redis.io/commands/setbit/
   */
  setBit: SETBIT,
  /**
   * Constructs the SETEX command
   *
   * @param key - The key to set
   * @param seconds - The expiration time in seconds
   * @param value - The value to set
   * @see https://redis.io/commands/setex/
   */
  SETEX,
  /**
   * Constructs the SETEX command
   *
   * @param key - The key to set
   * @param seconds - The expiration time in seconds
   * @param value - The value to set
   * @see https://redis.io/commands/setex/
   */
  setEx: SETEX,
  /**
   * Constructs the SETNX command
   *
   * @param key - The key to set if it doesn't exist
   * @param value - The value to set
   * @see https://redis.io/commands/setnx/
   */
  SETNX,
  /**
   * Constructs the SETNX command
   *
   * @param key - The key to set if it doesn't exist
   * @param value - The value to set
   * @see https://redis.io/commands/setnx/
   */
  setNX: SETNX,
  /**
   * Constructs the SETRANGE command
   *
   * @param key - The key to modify
   * @param offset - The offset at which to start writing
   * @param value - The value to write at the offset
   * @see https://redis.io/commands/setrange/
   */
  SETRANGE,
  /**
   * Constructs the SETRANGE command
   *
   * @param key - The key to modify
   * @param offset - The offset at which to start writing
   * @param value - The value to write at the offset
   * @see https://redis.io/commands/setrange/
   */
  setRange: SETRANGE,
  /**
   * Constructs the SINTER command
   *
   * @param keys - One or more set keys to compute the intersection from
   * @see https://redis.io/commands/sinter/
   */
  SINTER,
  /**
   * Constructs the SINTER command
   *
   * @param keys - One or more set keys to compute the intersection from
   * @see https://redis.io/commands/sinter/
   */
  sInter: SINTER,
  /**
   * Constructs the SINTERCARD command
   *
   * @param keys - One or more set keys to compute the intersection cardinality from
   * @param options - Options for the SINTERCARD command or a number for LIMIT (backwards compatibility)
   * @see https://redis.io/commands/sintercard/
   */
  SINTERCARD,
  /**
   * Constructs the SINTERCARD command
   *
   * @param keys - One or more set keys to compute the intersection cardinality from
   * @param options - Options for the SINTERCARD command or a number for LIMIT (backwards compatibility)
   * @see https://redis.io/commands/sintercard/
   */
  sInterCard: SINTERCARD,
  /**
   * Constructs the SINTERSTORE command
   *
   * @param destination - The destination key to store the result
   * @param keys - One or more set keys to compute the intersection from
   * @see https://redis.io/commands/sinterstore/
   */
  SINTERSTORE,
  /**
   * Constructs the SINTERSTORE command
   *
   * @param destination - The destination key to store the result
   * @param keys - One or more set keys to compute the intersection from
   * @see https://redis.io/commands/sinterstore/
   */
  sInterStore: SINTERSTORE,
  /**
   * Constructs the SISMEMBER command
   *
   * @param key - The set key to check membership in
   * @param member - The member to check for existence
   * @see https://redis.io/commands/sismember/
   */
  SISMEMBER,
  /**
   * Constructs the SISMEMBER command
   *
   * @param key - The set key to check membership in
   * @param member - The member to check for existence
   * @see https://redis.io/commands/sismember/
   */
  sIsMember: SISMEMBER,
  /**
   * Constructs the SMEMBERS command
   *
   * @param key - The set key to get all members from
   * @see https://redis.io/commands/smembers/
   */
  SMEMBERS,
  /**
   * Constructs the SMEMBERS command
   *
   * @param key - The set key to get all members from
   * @see https://redis.io/commands/smembers/
   */
  sMembers: SMEMBERS,
  /**
   * Constructs the SMISMEMBER command
   *
   * @param key - The set key to check membership in
   * @param members - The members to check for existence
   * @see https://redis.io/commands/smismember/
   */
  SMISMEMBER,
  /**
   * Constructs the SMISMEMBER command
   *
   * @param key - The set key to check membership in
   * @param members - The members to check for existence
   * @see https://redis.io/commands/smismember/
   */
  smIsMember: SMISMEMBER,
  /**
   * Constructs the SMOVE command
   *
   * @param source - The source set key
   * @param destination - The destination set key
   * @param member - The member to move
   * @see https://redis.io/commands/smove/
   */
  SMOVE,
  /**
   * Constructs the SMOVE command
   *
   * @param source - The source set key
   * @param destination - The destination set key
   * @param member - The member to move
   * @see https://redis.io/commands/smove/
   */
  sMove: SMOVE,
  /**
   * Read-only variant of SORT that sorts the elements in a list, set or sorted set.
   * @param args - Same parameters as the SORT command.
   */
  SORT_RO,
  /**
   * Read-only variant of SORT that sorts the elements in a list, set or sorted set.
   * @param args - Same parameters as the SORT command.
   */
  sortRo: SORT_RO,
  /**
   * Sorts the elements in a list, set or sorted set and stores the result in a new list.
   * @param source - Key of the source list, set or sorted set.
   * @param destination - Destination key where the result will be stored.
   * @param options - Optional sorting parameters.
   */
  SORT_STORE,
  /**
   * Sorts the elements in a list, set or sorted set and stores the result in a new list.
   * @param source - Key of the source list, set or sorted set.
   * @param destination - Destination key where the result will be stored.
   * @param options - Optional sorting parameters.
   */
  sortStore: SORT_STORE,
  /**
   * Constructs the SORT command
   *
   * @param key - The key to sort (list, set, or sorted set)
   * @param options - Sort options
   * @see https://redis.io/commands/sort/
   */
  SORT,
  /**
   * Constructs the SORT command
   *
   * @param key - The key to sort (list, set, or sorted set)
   * @param options - Sort options
   * @see https://redis.io/commands/sort/
   */
  sort: SORT,
  /**
   * Constructs the SPOP command to remove and return multiple random members from a set
   *
   * @param key - The key of the set to pop from
   * @param count - The number of members to pop
   * @see https://redis.io/commands/spop/
   */
  SPOP_COUNT,
  /**
   * Constructs the SPOP command to remove and return multiple random members from a set
   *
   * @param key - The key of the set to pop from
   * @param count - The number of members to pop
   * @see https://redis.io/commands/spop/
   */
  sPopCount: SPOP_COUNT,
  /**
   * Constructs the SPOP command to remove and return a random member from a set
   *
   * @param key - The key of the set to pop from
   * @see https://redis.io/commands/spop/
   */
  SPOP,
  /**
   * Constructs the SPOP command to remove and return a random member from a set
   *
   * @param key - The key of the set to pop from
   * @see https://redis.io/commands/spop/
   */
  sPop: SPOP,
  /**
   * Constructs the SPUBLISH command to post a message to a Sharded Pub/Sub channel
   *
   * @param channel - The channel to publish to
   * @param message - The message to publish
   * @see https://redis.io/commands/spublish/
   */
  SPUBLISH,
  /**
   * Constructs the SPUBLISH command to post a message to a Sharded Pub/Sub channel
   *
   * @param channel - The channel to publish to
   * @param message - The message to publish
   * @see https://redis.io/commands/spublish/
   */
  sPublish: SPUBLISH,
  /**
   * Constructs the SRANDMEMBER command to get multiple random members from a set
   *
   * @param key - The key of the set to get random members from
   * @param count - The number of members to return. If negative, may return the same member multiple times
   * @see https://redis.io/commands/srandmember/
   */
  SRANDMEMBER_COUNT,
  /**
   * Constructs the SRANDMEMBER command to get multiple random members from a set
   *
   * @param key - The key of the set to get random members from
   * @param count - The number of members to return. If negative, may return the same member multiple times
   * @see https://redis.io/commands/srandmember/
   */
  sRandMemberCount: SRANDMEMBER_COUNT,
  /**
   * Constructs the SRANDMEMBER command to get a random member from a set
   *
   * @param key - The key of the set to get random member from
   * @see https://redis.io/commands/srandmember/
   */
  SRANDMEMBER,
  /**
   * Constructs the SRANDMEMBER command to get a random member from a set
   *
   * @param key - The key of the set to get random member from
   * @see https://redis.io/commands/srandmember/
   */
  sRandMember: SRANDMEMBER,
  /**
   * Constructs the SREM command to remove one or more members from a set
   *
   * @param key - The key of the set to remove members from
   * @param members - One or more members to remove from the set
   * @returns The number of members that were removed from the set
   * @see https://redis.io/commands/srem/
   */
  SREM,
  /**
   * Constructs the SREM command to remove one or more members from a set
   *
   * @param key - The key of the set to remove members from
   * @param members - One or more members to remove from the set
   * @returns The number of members that were removed from the set
   * @see https://redis.io/commands/srem/
   */
  sRem: SREM,
  /**
   * Constructs the SSCAN command to incrementally iterate over elements in a set
   *
   * @param key - The key of the set to scan
   * @param cursor - The cursor position to start scanning from
   * @param options - Optional scanning parameters (COUNT and MATCH)
   * @returns Iterator containing cursor position and matching members
   * @see https://redis.io/commands/sscan/
   */
  SSCAN,
  /**
   * Constructs the SSCAN command to incrementally iterate over elements in a set
   *
   * @param key - The key of the set to scan
   * @param cursor - The cursor position to start scanning from
   * @param options - Optional scanning parameters (COUNT and MATCH)
   * @returns Iterator containing cursor position and matching members
   * @see https://redis.io/commands/sscan/
   */
  sScan: SSCAN,
  /**
   * Constructs the STRLEN command to get the length of a string value
   *
   * @param key - The key holding the string value
   * @returns The length of the string value, or 0 when key does not exist
   * @see https://redis.io/commands/strlen/
   */
  STRLEN,
  /**
   * Constructs the STRLEN command to get the length of a string value
   *
   * @param key - The key holding the string value
   * @returns The length of the string value, or 0 when key does not exist
   * @see https://redis.io/commands/strlen/
   */
  strLen: STRLEN,
  /**
   * Constructs the SUNION command to return the members of the set resulting from the union of all the given sets
   *
   * @param keys - One or more set keys to compute the union from
   * @returns Array of all elements that are members of at least one of the given sets
   * @see https://redis.io/commands/sunion/
   */
  SUNION,
  /**
   * Constructs the SUNION command to return the members of the set resulting from the union of all the given sets
   *
   * @param keys - One or more set keys to compute the union from
   * @returns Array of all elements that are members of at least one of the given sets
   * @see https://redis.io/commands/sunion/
   */
  sUnion: SUNION,
  /**
   * Constructs the SUNIONSTORE command to store the union of multiple sets into a destination set
   *
   * @param destination - The destination key to store the resulting set
   * @param keys - One or more source set keys to compute the union from
   * @returns The number of elements in the resulting set
   * @see https://redis.io/commands/sunionstore/
   */
  SUNIONSTORE,
  /**
   * Constructs the SUNIONSTORE command to store the union of multiple sets into a destination set
   *
   * @param destination - The destination key to store the resulting set
   * @param keys - One or more source set keys to compute the union from
   * @returns The number of elements in the resulting set
   * @see https://redis.io/commands/sunionstore/
   */
  sUnionStore: SUNIONSTORE,
  /**
   * Swaps the data of two Redis databases.
   * @param index1 - First database index.
   * @param index2 - Second database index.
   */
  SWAPDB,
  /**
   * Swaps the data of two Redis databases.
   * @param index1 - First database index.
   * @param index2 - Second database index.
   */
  swapDb: SWAPDB,
  /**
   * Constructs the TIME command to return the server's current time
   *
   * @returns Array containing the Unix timestamp in seconds and microseconds
   * @see https://redis.io/commands/time/
   */
  TIME,
  /**
   * Constructs the TIME command to return the server's current time
   *
   * @returns Array containing the Unix timestamp in seconds and microseconds
   * @see https://redis.io/commands/time/
   */
  time: TIME,
  /**
   * Constructs the TOUCH command to alter the last access time of keys
   *
   * @param key - One or more keys to touch
   * @returns The number of keys that were touched
   * @see https://redis.io/commands/touch/
   */
  TOUCH,
  /**
   * Constructs the TOUCH command to alter the last access time of keys
   *
   * @param key - One or more keys to touch
   * @returns The number of keys that were touched
   * @see https://redis.io/commands/touch/
   */
  touch: TOUCH,
  /**
   * Constructs the TTL command to get the remaining time to live of a key
   *
   * @param key - Key to check
   * @returns Time to live in seconds, -2 if key does not exist, -1 if has no timeout
   * @see https://redis.io/commands/ttl/
   */
  TTL,
  /**
   * Constructs the TTL command to get the remaining time to live of a key
   *
   * @param key - Key to check
   * @returns Time to live in seconds, -2 if key does not exist, -1 if has no timeout
   * @see https://redis.io/commands/ttl/
   */
  ttl: TTL,
  /**
   * Constructs the TYPE command to determine the data type stored at key
   *
   * @param key - Key to check
   * @returns String reply: "none", "string", "list", "set", "zset", "hash", "stream"
   * @see https://redis.io/commands/type/
   */
  TYPE,
  /**
   * Constructs the TYPE command to determine the data type stored at key
   *
   * @param key - Key to check
   * @returns String reply: "none", "string", "list", "set", "zset", "hash", "stream"
   * @see https://redis.io/commands/type/
   */
  type: TYPE,
  /**
   * Constructs the UNLINK command to asynchronously delete one or more keys
   *
   * @param keys - One or more keys to unlink
   * @returns The number of keys that were unlinked
   * @see https://redis.io/commands/unlink/
   */
  UNLINK,
  /**
   * Constructs the UNLINK command to asynchronously delete one or more keys
   *
   * @param keys - One or more keys to unlink
   * @returns The number of keys that were unlinked
   * @see https://redis.io/commands/unlink/
   */
  unlink: UNLINK,
  /**
   * Constructs the WAIT command to synchronize with replicas
   *
   * @param numberOfReplicas - Number of replicas that must acknowledge the write
   * @param timeout - Maximum time to wait in milliseconds
   * @returns The number of replicas that acknowledged the write
   * @see https://redis.io/commands/wait/
   */
  WAIT,
  /**
   * Constructs the WAIT command to synchronize with replicas
   *
   * @param numberOfReplicas - Number of replicas that must acknowledge the write
   * @param timeout - Maximum time to wait in milliseconds
   * @returns The number of replicas that acknowledged the write
   * @see https://redis.io/commands/wait/
   */
  wait: WAIT,
  /**
   * Constructs the XACK command to acknowledge the processing of stream messages in a consumer group
   *
   * @param key - The stream key
   * @param group - The consumer group name
   * @param id - One or more message IDs to acknowledge
   * @returns The number of messages successfully acknowledged
   * @see https://redis.io/commands/xack/
   */
  XACK,
  /**
   * Constructs the XACK command to acknowledge the processing of stream messages in a consumer group
   *
   * @param key - The stream key
   * @param group - The consumer group name
   * @param id - One or more message IDs to acknowledge
   * @returns The number of messages successfully acknowledged
   * @see https://redis.io/commands/xack/
   */
  xAck: XACK,
  /**
   * Constructs the XACKDEL command to acknowledge and delete one or multiple messages for a stream consumer group
   *
   * @param key - The stream key
   * @param group - The consumer group name
   * @param id - One or more message IDs to acknowledge and delete
   * @param policy - Policy to apply when deleting entries (optional, defaults to KEEPREF)
   * @returns Array of integers: -1 (not found), 1 (acknowledged and deleted), 2 (acknowledged with dangling refs)
   * @see https://redis.io/commands/xackdel/
   */
  XACKDEL,
  /**
   * Constructs the XACKDEL command to acknowledge and delete one or multiple messages for a stream consumer group
   *
   * @param key - The stream key
   * @param group - The consumer group name
   * @param id - One or more message IDs to acknowledge and delete
   * @param policy - Policy to apply when deleting entries (optional, defaults to KEEPREF)
   * @returns Array of integers: -1 (not found), 1 (acknowledged and deleted), 2 (acknowledged with dangling refs)
   * @see https://redis.io/commands/xackdel/
   */
  xAckDel: XACKDEL,
  /**
   * Constructs the XADD command with NOMKSTREAM option to append a new entry to an existing stream
   *
   * @param args - Arguments tuple containing parser, key, id, message, and options
   * @returns The ID of the added entry, or null if the stream doesn't exist
   * @see https://redis.io/commands/xadd/
   */
  XADD_NOMKSTREAM,
  /**
   * Constructs the XADD command with NOMKSTREAM option to append a new entry to an existing stream
   *
   * @param args - Arguments tuple containing parser, key, id, message, and options
   * @returns The ID of the added entry, or null if the stream doesn't exist
   * @see https://redis.io/commands/xadd/
   */
  xAddNoMkStream: XADD_NOMKSTREAM,
  /**
   * Constructs the XADD command to append a new entry to a stream
   *
   * @param key - The stream key
   * @param id - Message ID (* for auto-generation)
   * @param message - Key-value pairs representing the message fields
   * @param options - Additional options for stream trimming
   * @returns The ID of the added entry
   * @see https://redis.io/commands/xadd/
   */
  XADD,
  /**
   * Constructs the XADD command to append a new entry to a stream
   *
   * @param key - The stream key
   * @param id - Message ID (* for auto-generation)
   * @param message - Key-value pairs representing the message fields
   * @param options - Additional options for stream trimming
   * @returns The ID of the added entry
   * @see https://redis.io/commands/xadd/
   */
  xAdd: XADD,
  /**
   * Constructs the XAUTOCLAIM command with JUSTID option to get only message IDs
   *
   * @param args - Same parameters as XAUTOCLAIM command
   * @returns Object containing nextId and arrays of claimed and deleted message IDs
   * @see https://redis.io/commands/xautoclaim/
   */
  XAUTOCLAIM_JUSTID,
  /**
   * Constructs the XAUTOCLAIM command with JUSTID option to get only message IDs
   *
   * @param args - Same parameters as XAUTOCLAIM command
   * @returns Object containing nextId and arrays of claimed and deleted message IDs
   * @see https://redis.io/commands/xautoclaim/
   */
  xAutoClaimJustId: XAUTOCLAIM_JUSTID,
  /**
   * Constructs the XAUTOCLAIM command to automatically claim pending messages in a consumer group
   *
   * @param key - The stream key
   * @param group - The consumer group name
   * @param consumer - The consumer name that will claim the messages
   * @param minIdleTime - Minimum idle time in milliseconds for a message to be claimed
   * @param start - Message ID to start scanning from
   * @param options - Additional options for the claim operation
   * @returns Object containing nextId, claimed messages, and list of deleted message IDs
   * @see https://redis.io/commands/xautoclaim/
   */
  XAUTOCLAIM,
  /**
   * Constructs the XAUTOCLAIM command to automatically claim pending messages in a consumer group
   *
   * @param key - The stream key
   * @param group - The consumer group name
   * @param consumer - The consumer name that will claim the messages
   * @param minIdleTime - Minimum idle time in milliseconds for a message to be claimed
   * @param start - Message ID to start scanning from
   * @param options - Additional options for the claim operation
   * @returns Object containing nextId, claimed messages, and list of deleted message IDs
   * @see https://redis.io/commands/xautoclaim/
   */
  xAutoClaim: XAUTOCLAIM,
  /**
   * Constructs the XCLAIM command with JUSTID option to get only message IDs
   *
   * @param args - Same parameters as XCLAIM command
   * @returns Array of successfully claimed message IDs
   * @see https://redis.io/commands/xclaim/
   */
  XCLAIM_JUSTID,
  /**
   * Constructs the XCLAIM command with JUSTID option to get only message IDs
   *
   * @param args - Same parameters as XCLAIM command
   * @returns Array of successfully claimed message IDs
   * @see https://redis.io/commands/xclaim/
   */
  xClaimJustId: XCLAIM_JUSTID,
  /**
   * Constructs the XCLAIM command to claim pending messages in a consumer group
   *
   * @param key - The stream key
   * @param group - The consumer group name
   * @param consumer - The consumer name that will claim the messages
   * @param minIdleTime - Minimum idle time in milliseconds for a message to be claimed
   * @param id - One or more message IDs to claim
   * @param options - Additional options for the claim operation
   * @returns Array of claimed messages
   * @see https://redis.io/commands/xclaim/
   */
  XCLAIM,
  /**
   * Constructs the XCLAIM command to claim pending messages in a consumer group
   *
   * @param key - The stream key
   * @param group - The consumer group name
   * @param consumer - The consumer name that will claim the messages
   * @param minIdleTime - Minimum idle time in milliseconds for a message to be claimed
   * @param id - One or more message IDs to claim
   * @param options - Additional options for the claim operation
   * @returns Array of claimed messages
   * @see https://redis.io/commands/xclaim/
   */
  xClaim: XCLAIM,
  /**
   * Configures the idempotency parameters for a stream's IDMP map.
   * Sets how long Redis remembers each iid and the maximum number of iids to track.
   * This command clears the existing IDMP map (Redis forgets all previously stored iids),
   * but only if the configuration value actually changes.
   *
   * @param key - The name of the stream
   * @param options - Optional idempotency configuration parameters
   * @returns 'OK' on success
   */
  XCFGSET,
  /**
   * Configures the idempotency parameters for a stream's IDMP map.
   * Sets how long Redis remembers each iid and the maximum number of iids to track.
   * This command clears the existing IDMP map (Redis forgets all previously stored iids),
   * but only if the configuration value actually changes.
   *
   * @param key - The name of the stream
   * @param options - Optional idempotency configuration parameters
   * @returns 'OK' on success
   */
  xCfgSet: XCFGSET,
  /**
   * Constructs the XDEL command to remove one or more messages from a stream
   *
   * @param key - The stream key
   * @param id - One or more message IDs to delete
   * @returns The number of messages actually deleted
   * @see https://redis.io/commands/xdel/
   */
  XDEL,
  /**
   * Constructs the XDEL command to remove one or more messages from a stream
   *
   * @param key - The stream key
   * @param id - One or more message IDs to delete
   * @returns The number of messages actually deleted
   * @see https://redis.io/commands/xdel/
   */
  xDel: XDEL,
  /**
   * Constructs the XDELEX command to delete one or multiple entries from the stream
   *
   * @param key - The stream key
   * @param id - One or more message IDs to delete
   * @param policy - Policy to apply when deleting entries (optional, defaults to KEEPREF)
   * @returns Array of integers: -1 (not found), 1 (deleted), 2 (dangling refs)
   * @see https://redis.io/commands/xdelex/
   */
  XDELEX,
  /**
   * Constructs the XDELEX command to delete one or multiple entries from the stream
   *
   * @param key - The stream key
   * @param id - One or more message IDs to delete
   * @param policy - Policy to apply when deleting entries (optional, defaults to KEEPREF)
   * @returns Array of integers: -1 (not found), 1 (deleted), 2 (dangling refs)
   * @see https://redis.io/commands/xdelex/
   */
  xDelEx: XDELEX,
  /**
   * Constructs the XGROUP CREATE command to create a consumer group for a stream
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param id - ID of the last delivered item in the stream ('$' for last item, '0' for all items)
   * @param options - Additional options for group creation
   * @returns 'OK' if successful
   * @see https://redis.io/commands/xgroup-create/
   */
  XGROUP_CREATE,
  /**
   * Constructs the XGROUP CREATE command to create a consumer group for a stream
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param id - ID of the last delivered item in the stream ('$' for last item, '0' for all items)
   * @param options - Additional options for group creation
   * @returns 'OK' if successful
   * @see https://redis.io/commands/xgroup-create/
   */
  xGroupCreate: XGROUP_CREATE,
  /**
   * Constructs the XGROUP CREATECONSUMER command to create a new consumer in a consumer group
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param consumer - Name of the consumer to create
   * @returns 1 if the consumer was created, 0 if it already existed
   * @see https://redis.io/commands/xgroup-createconsumer/
   */
  XGROUP_CREATECONSUMER,
  /**
   * Constructs the XGROUP CREATECONSUMER command to create a new consumer in a consumer group
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param consumer - Name of the consumer to create
   * @returns 1 if the consumer was created, 0 if it already existed
   * @see https://redis.io/commands/xgroup-createconsumer/
   */
  xGroupCreateConsumer: XGROUP_CREATECONSUMER,
  /**
   * Constructs the XGROUP DELCONSUMER command to remove a consumer from a consumer group
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param consumer - Name of the consumer to remove
   * @returns The number of pending messages owned by the deleted consumer
   * @see https://redis.io/commands/xgroup-delconsumer/
   */
  XGROUP_DELCONSUMER,
  /**
   * Constructs the XGROUP DELCONSUMER command to remove a consumer from a consumer group
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param consumer - Name of the consumer to remove
   * @returns The number of pending messages owned by the deleted consumer
   * @see https://redis.io/commands/xgroup-delconsumer/
   */
  xGroupDelConsumer: XGROUP_DELCONSUMER,
  /**
   * Constructs the XGROUP DESTROY command to remove a consumer group
   *
   * @param key - The stream key
   * @param group - Name of the consumer group to destroy
   * @returns 1 if the group was destroyed, 0 if it did not exist
   * @see https://redis.io/commands/xgroup-destroy/
   */
  XGROUP_DESTROY,
  /**
   * Constructs the XGROUP DESTROY command to remove a consumer group
   *
   * @param key - The stream key
   * @param group - Name of the consumer group to destroy
   * @returns 1 if the group was destroyed, 0 if it did not exist
   * @see https://redis.io/commands/xgroup-destroy/
   */
  xGroupDestroy: XGROUP_DESTROY,
  /**
   * Constructs the XGROUP SETID command to set the last delivered ID for a consumer group
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param id - ID to set as last delivered message ('$' for last item, '0' for all items)
   * @param options - Additional options for setting the group ID
   * @returns 'OK' if successful
   * @see https://redis.io/commands/xgroup-setid/
   */
  XGROUP_SETID,
  /**
   * Constructs the XGROUP SETID command to set the last delivered ID for a consumer group
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param id - ID to set as last delivered message ('$' for last item, '0' for all items)
   * @param options - Additional options for setting the group ID
   * @returns 'OK' if successful
   * @see https://redis.io/commands/xgroup-setid/
   */
  xGroupSetId: XGROUP_SETID,
  /**
   * Constructs the XINFO CONSUMERS command to list the consumers in a consumer group
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @returns Array of consumer information objects
   * @see https://redis.io/commands/xinfo-consumers/
   */
  XINFO_CONSUMERS,
  /**
   * Constructs the XINFO CONSUMERS command to list the consumers in a consumer group
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @returns Array of consumer information objects
   * @see https://redis.io/commands/xinfo-consumers/
   */
  xInfoConsumers: XINFO_CONSUMERS,
  /**
   * Constructs the XINFO GROUPS command to list the consumer groups of a stream
   *
   * @param key - The stream key
   * @returns Array of consumer group information objects
   * @see https://redis.io/commands/xinfo-groups/
   */
  XINFO_GROUPS,
  /**
   * Constructs the XINFO GROUPS command to list the consumer groups of a stream
   *
   * @param key - The stream key
   * @returns Array of consumer group information objects
   * @see https://redis.io/commands/xinfo-groups/
   */
  xInfoGroups: XINFO_GROUPS,
  /**
   * Constructs the XINFO STREAM command to get detailed information about a stream
   *
   * @param key - The stream key
   * @returns Detailed information about the stream including its length, structure, and entries
   * @see https://redis.io/commands/xinfo-stream/
   */
  XINFO_STREAM,
  /**
   * Constructs the XINFO STREAM command to get detailed information about a stream
   *
   * @param key - The stream key
   * @returns Detailed information about the stream including its length, structure, and entries
   * @see https://redis.io/commands/xinfo-stream/
   */
  xInfoStream: XINFO_STREAM,
  /**
   * Constructs the XLEN command to get the number of entries in a stream
   *
   * @param key - The stream key
   * @returns The number of entries inside the stream
   * @see https://redis.io/commands/xlen/
   */
  XLEN,
  /**
   * Constructs the XLEN command to get the number of entries in a stream
   *
   * @param key - The stream key
   * @returns The number of entries inside the stream
   * @see https://redis.io/commands/xlen/
   */
  xLen: XLEN,
  /**
   * Constructs the XNACK command to negatively acknowledge one or more pending stream entries.
   * Added since Redis 8.8.
   *
   * @param key - The stream key
   * @param group - The consumer group name
   * @param mode - NACK mode: SILENT, FAIL, or FATAL
   * @param id - One or more message IDs to nack
   * @param options - Additional options for retry count and force handling
   * @returns Number of entries acknowledged
   * @see https://redis.io/commands/xnack/
   */
  XNACK,
  /**
   * Constructs the XNACK command to negatively acknowledge one or more pending stream entries.
   * Added since Redis 8.8.
   *
   * @param key - The stream key
   * @param group - The consumer group name
   * @param mode - NACK mode: SILENT, FAIL, or FATAL
   * @param id - One or more message IDs to nack
   * @param options - Additional options for retry count and force handling
   * @returns Number of entries acknowledged
   * @see https://redis.io/commands/xnack/
   */
  xNack: XNACK,
  /**
   * Constructs the XPENDING command with range parameters to get detailed information about pending messages
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param start - Start of ID range (use '-' for minimum ID)
   * @param end - End of ID range (use '+' for maximum ID)
   * @param count - Maximum number of messages to return
   * @param options - Additional filtering options
   * @returns Array of pending message details
   * @see https://redis.io/commands/xpending/
   */
  XPENDING_RANGE,
  /**
   * Constructs the XPENDING command with range parameters to get detailed information about pending messages
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param start - Start of ID range (use '-' for minimum ID)
   * @param end - End of ID range (use '+' for maximum ID)
   * @param count - Maximum number of messages to return
   * @param options - Additional filtering options
   * @returns Array of pending message details
   * @see https://redis.io/commands/xpending/
   */
  xPendingRange: XPENDING_RANGE,
  /**
   * Constructs the XPENDING command to inspect pending messages of a consumer group
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @returns Summary of pending messages including total count, ID range, and per-consumer stats
   * @see https://redis.io/commands/xpending/
   */
  XPENDING,
  /**
   * Constructs the XPENDING command to inspect pending messages of a consumer group
   *
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @returns Summary of pending messages including total count, ID range, and per-consumer stats
   * @see https://redis.io/commands/xpending/
   */
  xPending: XPENDING,
  /**
   * Constructs the XRANGE command to read stream entries in a specific range
   *
   * @param key - The stream key
   * @param args - Arguments tuple containing start ID, end ID, and options
   * @returns Array of messages in the specified range
   * @see https://redis.io/commands/xrange/
   */
  XRANGE,
  /**
   * Constructs the XRANGE command to read stream entries in a specific range
   *
   * @param key - The stream key
   * @param args - Arguments tuple containing start ID, end ID, and options
   * @returns Array of messages in the specified range
   * @see https://redis.io/commands/xrange/
   */
  xRange: XRANGE,
  /**
   * Constructs the XREAD command to read messages from one or more streams
   *
   * @param streams - Single stream or array of streams to read from
   * @param options - Additional options for reading streams
   * @returns Array of stream entries, each containing the stream name and its messages
   * @see https://redis.io/commands/xread/
   */
  XREAD,
  /**
   * Constructs the XREAD command to read messages from one or more streams
   *
   * @param streams - Single stream or array of streams to read from
   * @param options - Additional options for reading streams
   * @returns Array of stream entries, each containing the stream name and its messages
   * @see https://redis.io/commands/xread/
   */
  xRead: XREAD,
  /**
   * Constructs the XREADGROUP command to read messages from streams as a consumer group member
   *
   * @param group - Name of the consumer group
   * @param consumer - Name of the consumer in the group
   * @param streams - Single stream or array of streams to read from
   * @param options - Additional options for reading streams
   * @returns Array of stream entries, each containing the stream name and its messages
   * @see https://redis.io/commands/xreadgroup/
   */
  XREADGROUP,
  /**
   * Constructs the XREADGROUP command to read messages from streams as a consumer group member
   *
   * @param group - Name of the consumer group
   * @param consumer - Name of the consumer in the group
   * @param streams - Single stream or array of streams to read from
   * @param options - Additional options for reading streams
   * @returns Array of stream entries, each containing the stream name and its messages
   * @see https://redis.io/commands/xreadgroup/
   */
  xReadGroup: XREADGROUP,
  /**
   * Constructs the XREVRANGE command to read stream entries in reverse order
   *
   * @param key - The stream key
   * @param args - Arguments tuple containing start ID, end ID, and options
   * @returns Array of messages in the specified range in reverse order
   * @see https://redis.io/commands/xrevrange/
   */
  XREVRANGE,
  /**
   * Constructs the XREVRANGE command to read stream entries in reverse order
   *
   * @param key - The stream key
   * @param args - Arguments tuple containing start ID, end ID, and options
   * @returns Array of messages in the specified range in reverse order
   * @see https://redis.io/commands/xrevrange/
   */
  xRevRange: XREVRANGE,
  /**
   * Sets the stream's last-generated ID.
   *
   * @param key - The stream key
   * @param lastId - The ID to set as the stream's last-generated ID
   * @param options - Optional metadata values for ENTRIESADDED and MAXDELETEDID
   * @returns OK on success
   * @see https://redis.io/commands/xsetid/
   */
  XSETID,
  /**
   * Sets the stream's last-generated ID.
   *
   * @param key - The stream key
   * @param lastId - The ID to set as the stream's last-generated ID
   * @param options - Optional metadata values for ENTRIESADDED and MAXDELETEDID
   * @returns OK on success
   * @see https://redis.io/commands/xsetid/
   */
  xSetId: XSETID,
  /**
   * Constructs the XTRIM command to trim a stream by length or minimum ID
   *
   * @param key - The stream key
   * @param strategy - Trim by maximum length (MAXLEN) or minimum ID (MINID)
   * @param threshold - Maximum length or minimum ID threshold
   * @param options - Additional options for trimming
   * @returns Number of entries removed from the stream
   * @see https://redis.io/commands/xtrim/
   */
  XTRIM,
  /**
   * Constructs the XTRIM command to trim a stream by length or minimum ID
   *
   * @param key - The stream key
   * @param strategy - Trim by maximum length (MAXLEN) or minimum ID (MINID)
   * @param threshold - Maximum length or minimum ID threshold
   * @param options - Additional options for trimming
   * @returns Number of entries removed from the stream
   * @see https://redis.io/commands/xtrim/
   */
  xTrim: XTRIM,
  /**
   * Constructs the ZADD command with INCR option to increment the score of a member
   *
   * @param key - The sorted set key
   * @param members - Member(s) whose score to increment
   * @param options - Additional options for the increment operation
   * @returns The new score of the member after increment (null if member does not exist with XX option)
   * @see https://redis.io/commands/zadd/
   */
  ZADD_INCR,
  /**
   * Constructs the ZADD command with INCR option to increment the score of a member
   *
   * @param key - The sorted set key
   * @param members - Member(s) whose score to increment
   * @param options - Additional options for the increment operation
   * @returns The new score of the member after increment (null if member does not exist with XX option)
   * @see https://redis.io/commands/zadd/
   */
  zAddIncr: ZADD_INCR,
  /**
   * Constructs the ZADD command to add one or more members to a sorted set
   *
   * @param key - The sorted set key
   * @param members - One or more members to add with their scores
   * @param options - Additional options for adding members
   * @returns Number of new members added (or changed members if CH is set)
   * @see https://redis.io/commands/zadd/
   */
  ZADD,
  /**
   * Constructs the ZADD command to add one or more members to a sorted set
   *
   * @param key - The sorted set key
   * @param members - One or more members to add with their scores
   * @param options - Additional options for adding members
   * @returns Number of new members added (or changed members if CH is set)
   * @see https://redis.io/commands/zadd/
   */
  zAdd: ZADD,
  /**
   * Constructs the ZCARD command to get the cardinality (number of members) of a sorted set
   *
   * @param key - The sorted set key
   * @returns Number of members in the sorted set
   * @see https://redis.io/commands/zcard/
   */
  ZCARD,
  /**
   * Constructs the ZCARD command to get the cardinality (number of members) of a sorted set
   *
   * @param key - The sorted set key
   * @returns Number of members in the sorted set
   * @see https://redis.io/commands/zcard/
   */
  zCard: ZCARD,
  /**
   * Returns the number of elements in the sorted set with a score between min and max.
   * @param key - Key of the sorted set.
   * @param min - Minimum score to count from (inclusive).
   * @param max - Maximum score to count to (inclusive).
   */
  ZCOUNT,
  /**
   * Returns the number of elements in the sorted set with a score between min and max.
   * @param key - Key of the sorted set.
   * @param min - Minimum score to count from (inclusive).
   * @param max - Maximum score to count to (inclusive).
   */
  zCount: ZCOUNT,
  /**
   * Returns the difference between the first sorted set and all successive sorted sets with their scores.
   * @param keys - Keys of the sorted sets.
   */
  ZDIFF_WITHSCORES,
  /**
   * Returns the difference between the first sorted set and all successive sorted sets with their scores.
   * @param keys - Keys of the sorted sets.
   */
  zDiffWithScores: ZDIFF_WITHSCORES,
  /**
   * Returns the difference between the first sorted set and all the successive sorted sets.
   * @param keys - Keys of the sorted sets.
   */
  ZDIFF,
  /**
   * Returns the difference between the first sorted set and all the successive sorted sets.
   * @param keys - Keys of the sorted sets.
   */
  zDiff: ZDIFF,
  /**
   * Computes the difference between the first and all successive sorted sets and stores it in a new key.
   * @param destination - Destination key where the result will be stored.
   * @param inputKeys - Keys of the sorted sets to find the difference between.
   */
  ZDIFFSTORE,
  /**
   * Computes the difference between the first and all successive sorted sets and stores it in a new key.
   * @param destination - Destination key where the result will be stored.
   * @param inputKeys - Keys of the sorted sets to find the difference between.
   */
  zDiffStore: ZDIFFSTORE,
  /**
   * Increments the score of a member in a sorted set by the specified increment.
   * @param key - Key of the sorted set.
   * @param increment - Value to increment the score by.
   * @param member - Member whose score should be incremented.
   */
  ZINCRBY,
  /**
   * Increments the score of a member in a sorted set by the specified increment.
   * @param key - Key of the sorted set.
   * @param increment - Value to increment the score by.
   * @param member - Member whose score should be incremented.
   */
  zIncrBy: ZINCRBY,
  /**
   * Intersects multiple sorted sets and returns the result with scores.
   * @param args - Same parameters as ZINTER command.
   */
  ZINTER_WITHSCORES,
  /**
   * Intersects multiple sorted sets and returns the result with scores.
   * @param args - Same parameters as ZINTER command.
   */
  zInterWithScores: ZINTER_WITHSCORES,
  /**
   * Intersects multiple sorted sets and returns the result as a new sorted set.
   * @param keys - Keys of the sorted sets to intersect.
   * @param options - Optional parameters for the intersection operation.
   */
  ZINTER,
  /**
   * Intersects multiple sorted sets and returns the result as a new sorted set.
   * @param keys - Keys of the sorted sets to intersect.
   * @param options - Optional parameters for the intersection operation.
   */
  zInter: ZINTER,
  /**
   * Returns the cardinality of the intersection of multiple sorted sets.
   * @param keys - Keys of the sorted sets to intersect.
   * @param options - Limit option or options object with limit.
   */
  ZINTERCARD,
  /**
   * Returns the cardinality of the intersection of multiple sorted sets.
   * @param keys - Keys of the sorted sets to intersect.
   * @param options - Limit option or options object with limit.
   */
  zInterCard: ZINTERCARD,
  /**
   * Stores the result of intersection of multiple sorted sets in a new sorted set.
   * @param destination - Destination key where the result will be stored.
   * @param keys - Keys of the sorted sets to intersect.
   * @param options - Optional parameters for the intersection operation.
   */
  ZINTERSTORE,
  /**
   * Stores the result of intersection of multiple sorted sets in a new sorted set.
   * @param destination - Destination key where the result will be stored.
   * @param keys - Keys of the sorted sets to intersect.
   * @param options - Optional parameters for the intersection operation.
   */
  zInterStore: ZINTERSTORE,
  /**
   * Returns the number of elements in the sorted set between the lexicographical range specified by min and max.
   * @param key - Key of the sorted set.
   * @param min - Minimum lexicographical value (inclusive).
   * @param max - Maximum lexicographical value (inclusive).
   */
  ZLEXCOUNT,
  /**
   * Returns the number of elements in the sorted set between the lexicographical range specified by min and max.
   * @param key - Key of the sorted set.
   * @param min - Minimum lexicographical value (inclusive).
   * @param max - Maximum lexicographical value (inclusive).
   */
  zLexCount: ZLEXCOUNT,
  /**
   * Removes and returns up to count members with the highest/lowest scores from the first non-empty sorted set.
   * @param keys - Keys of the sorted sets to pop from.
   * @param side - Side to pop from (MIN or MAX).
   * @param options - Optional parameters including COUNT.
   */
  ZMPOP,
  /**
   * Removes and returns up to count members with the highest/lowest scores from the first non-empty sorted set.
   * @param keys - Keys of the sorted sets to pop from.
   * @param side - Side to pop from (MIN or MAX).
   * @param options - Optional parameters including COUNT.
   */
  zmPop: ZMPOP,
  /**
   * Returns the scores associated with the specified members in the sorted set stored at key.
   * @param key - Key of the sorted set.
   * @param member - One or more members to get scores for.
   */
  ZMSCORE,
  /**
   * Returns the scores associated with the specified members in the sorted set stored at key.
   * @param key - Key of the sorted set.
   * @param member - One or more members to get scores for.
   */
  zmScore: ZMSCORE,
  /**
   * Removes and returns up to count members with the highest scores in the sorted set.
   * @param key - Key of the sorted set.
   * @param count - Number of members to pop.
   */
  ZPOPMAX_COUNT,
  /**
   * Removes and returns up to count members with the highest scores in the sorted set.
   * @param key - Key of the sorted set.
   * @param count - Number of members to pop.
   */
  zPopMaxCount: ZPOPMAX_COUNT,
  /**
   * Removes and returns the member with the highest score in the sorted set.
   * @param key - Key of the sorted set.
   */
  ZPOPMAX,
  /**
   * Removes and returns the member with the highest score in the sorted set.
   * @param key - Key of the sorted set.
   */
  zPopMax: ZPOPMAX,
  /**
   * Removes and returns up to count members with the lowest scores in the sorted set.
   * @param key - Key of the sorted set.
   * @param count - Number of members to pop.
   */
  ZPOPMIN_COUNT,
  /**
   * Removes and returns up to count members with the lowest scores in the sorted set.
   * @param key - Key of the sorted set.
   * @param count - Number of members to pop.
   */
  zPopMinCount: ZPOPMIN_COUNT,
  /**
   * Removes and returns the member with the lowest score in the sorted set.
   * @param key - Key of the sorted set.
   */
  ZPOPMIN,
  /**
   * Removes and returns the member with the lowest score in the sorted set.
   * @param key - Key of the sorted set.
   */
  zPopMin: ZPOPMIN,
  /**
   * Returns one or more random members with their scores from a sorted set.
   * @param key - Key of the sorted set.
   * @param count - Number of members to return.
   */
  ZRANDMEMBER_COUNT_WITHSCORES,
  /**
   * Returns one or more random members with their scores from a sorted set.
   * @param key - Key of the sorted set.
   * @param count - Number of members to return.
   */
  zRandMemberCountWithScores: ZRANDMEMBER_COUNT_WITHSCORES,
  /**
   * Returns one or more random members from a sorted set.
   * @param key - Key of the sorted set.
   * @param count - Number of members to return.
   */
  ZRANDMEMBER_COUNT,
  /**
   * Returns one or more random members from a sorted set.
   * @param key - Key of the sorted set.
   * @param count - Number of members to return.
   */
  zRandMemberCount: ZRANDMEMBER_COUNT,
  /**
   * Returns a random member from a sorted set.
   * @param key - Key of the sorted set.
   */
  ZRANDMEMBER,
  /**
   * Returns a random member from a sorted set.
   * @param key - Key of the sorted set.
   */
  zRandMember: ZRANDMEMBER,
  /**
   * Returns the specified range of elements in the sorted set with their scores.
   * @param args - Same parameters as the ZRANGE command.
   */
  ZRANGE_WITHSCORES,
  /**
   * Returns the specified range of elements in the sorted set with their scores.
   * @param args - Same parameters as the ZRANGE command.
   */
  zRangeWithScores: ZRANGE_WITHSCORES,
  /**
   * Returns the specified range of elements in the sorted set.
   * @param key - Key of the sorted set.
   * @param min - Minimum index, score or lexicographical value.
   * @param max - Maximum index, score or lexicographical value.
   * @param options - Optional parameters for range retrieval (BY, REV, LIMIT).
   */
  ZRANGE,
  /**
   * Returns the specified range of elements in the sorted set.
   * @param key - Key of the sorted set.
   * @param min - Minimum index, score or lexicographical value.
   * @param max - Maximum index, score or lexicographical value.
   * @param options - Optional parameters for range retrieval (BY, REV, LIMIT).
   */
  zRange: ZRANGE,
  /**
   * Returns all the elements in the sorted set at key with a lexicographical value between min and max.
   * @param key - Key of the sorted set.
   * @param min - Minimum lexicographical value.
   * @param max - Maximum lexicographical value.
   * @param options - Optional parameters including LIMIT.
   */
  ZRANGEBYLEX,
  /**
   * Returns all the elements in the sorted set at key with a lexicographical value between min and max.
   * @param key - Key of the sorted set.
   * @param min - Minimum lexicographical value.
   * @param max - Maximum lexicographical value.
   * @param options - Optional parameters including LIMIT.
   */
  zRangeByLex: ZRANGEBYLEX,
  /**
   * Returns all the elements in the sorted set with a score between min and max, with their scores.
   * @param args - Same parameters as the ZRANGEBYSCORE command.
   */
  ZRANGEBYSCORE_WITHSCORES,
  /**
   * Returns all the elements in the sorted set with a score between min and max, with their scores.
   * @param args - Same parameters as the ZRANGEBYSCORE command.
   */
  zRangeByScoreWithScores: ZRANGEBYSCORE_WITHSCORES,
  /**
   * Returns all the elements in the sorted set with a score between min and max.
   * @param key - Key of the sorted set.
   * @param min - Minimum score.
   * @param max - Maximum score.
   * @param options - Optional parameters including LIMIT.
   */
  ZRANGEBYSCORE,
  /**
   * Returns all the elements in the sorted set with a score between min and max.
   * @param key - Key of the sorted set.
   * @param min - Minimum score.
   * @param max - Maximum score.
   * @param options - Optional parameters including LIMIT.
   */
  zRangeByScore: ZRANGEBYSCORE,
  /**
   * Stores the result of a range operation on a sorted set into a new sorted set.
   * @param destination - Destination key where the result will be stored.
   * @param source - Key of the source sorted set.
   * @param min - Minimum index, score or lexicographical value.
   * @param max - Maximum index, score or lexicographical value.
   * @param options - Optional parameters for the range operation (BY, REV, LIMIT).
   */
  ZRANGESTORE,
  /**
   * Stores the result of a range operation on a sorted set into a new sorted set.
   * @param destination - Destination key where the result will be stored.
   * @param source - Key of the source sorted set.
   * @param min - Minimum index, score or lexicographical value.
   * @param max - Maximum index, score or lexicographical value.
   * @param options - Optional parameters for the range operation (BY, REV, LIMIT).
   */
  zRangeStore: ZRANGESTORE,
  /**
   * Returns the rank of a member in the sorted set with its score.
   * @param args - Same parameters as the ZRANK command.
   */
  ZRANK_WITHSCORE,
  /**
   * Returns the rank of a member in the sorted set with its score.
   * @param args - Same parameters as the ZRANK command.
   */
  zRankWithScore: ZRANK_WITHSCORE,
  /**
   * Returns the rank of a member in the sorted set, with scores ordered from low to high.
   * @param key - Key of the sorted set.
   * @param member - Member to get the rank for.
   */
  ZRANK,
  /**
   * Returns the rank of a member in the sorted set, with scores ordered from low to high.
   * @param key - Key of the sorted set.
   * @param member - Member to get the rank for.
   */
  zRank: ZRANK,
  /**
   * Removes the specified members from the sorted set.
   * @param key - Key of the sorted set.
   * @param member - One or more members to remove.
   */
  ZREM,
  /**
   * Removes the specified members from the sorted set.
   * @param key - Key of the sorted set.
   * @param member - One or more members to remove.
   */
  zRem: ZREM,
  /**
   * Removes all elements in the sorted set with lexicographical values between min and max.
   * @param key - Key of the sorted set.
   * @param min - Minimum lexicographical value.
   * @param max - Maximum lexicographical value.
   */
  ZREMRANGEBYLEX,
  /**
   * Removes all elements in the sorted set with lexicographical values between min and max.
   * @param key - Key of the sorted set.
   * @param min - Minimum lexicographical value.
   * @param max - Maximum lexicographical value.
   */
  zRemRangeByLex: ZREMRANGEBYLEX,
  /**
   * Removes all elements in the sorted set with rank between start and stop.
   * @param key - Key of the sorted set.
   * @param start - Minimum rank (starting from 0).
   * @param stop - Maximum rank.
   */
  ZREMRANGEBYRANK,
  /**
   * Removes all elements in the sorted set with rank between start and stop.
   * @param key - Key of the sorted set.
   * @param start - Minimum rank (starting from 0).
   * @param stop - Maximum rank.
   */
  zRemRangeByRank: ZREMRANGEBYRANK,
  /**
   * Removes all elements in the sorted set with scores between min and max.
   * @param key - Key of the sorted set.
   * @param min - Minimum score.
   * @param max - Maximum score.
   */
  ZREMRANGEBYSCORE,
  /**
   * Removes all elements in the sorted set with scores between min and max.
   * @param key - Key of the sorted set.
   * @param min - Minimum score.
   * @param max - Maximum score.
   */
  zRemRangeByScore: ZREMRANGEBYSCORE,
  /**
   * Returns the rank of a member in the sorted set, with scores ordered from high to low.
   * @param key - Key of the sorted set.
   * @param member - Member to get the rank for.
   */
  ZREVRANK,
  /**
   * Returns the rank of a member in the sorted set, with scores ordered from high to low.
   * @param key - Key of the sorted set.
   * @param member - Member to get the rank for.
   */
  zRevRank: ZREVRANK,
  /**
   * Incrementally iterates over a sorted set.
   * @param key - Key of the sorted set.
   * @param cursor - Cursor position to start the scan from.
   * @param options - Optional scan parameters (COUNT, MATCH, TYPE).
   */
  ZSCAN,
  /**
   * Incrementally iterates over a sorted set.
   * @param key - Key of the sorted set.
   * @param cursor - Cursor position to start the scan from.
   * @param options - Optional scan parameters (COUNT, MATCH, TYPE).
   */
  zScan: ZSCAN,
  /**
   * Returns the score of a member in a sorted set.
   * @param key - Key of the sorted set.
   * @param member - Member to get the score for.
   */
  ZSCORE,
  /**
   * Returns the score of a member in a sorted set.
   * @param key - Key of the sorted set.
   * @param member - Member to get the score for.
   */
  zScore: ZSCORE,
  /**
   * Returns the union of multiple sorted sets with their scores.
   * @param args - Same parameters as the ZUNION command.
   */
  ZUNION_WITHSCORES,
  /**
   * Returns the union of multiple sorted sets with their scores.
   * @param args - Same parameters as the ZUNION command.
   */
  zUnionWithScores: ZUNION_WITHSCORES,
  /**
   * Returns the union of multiple sorted sets.
   * @param keys - Keys of the sorted sets to combine.
   * @param options - Optional parameters for the union operation.
   */
  ZUNION,
  /**
   * Returns the union of multiple sorted sets.
   * @param keys - Keys of the sorted sets to combine.
   * @param options - Optional parameters for the union operation.
   */
  zUnion: ZUNION,
  /**
   * Stores the union of multiple sorted sets in a new sorted set.
   * @param destination - Destination key where the result will be stored.
   * @param keys - Keys of the sorted sets to combine.
   * @param options - Optional parameters for the union operation.
   */
  ZUNIONSTORE,
  /**
   * Stores the union of multiple sorted sets in a new sorted set.
   * @param destination - Destination key where the result will be stored.
   * @param keys - Keys of the sorted sets to combine.
   * @param options - Optional parameters for the union operation.
   */
  zUnionStore: ZUNIONSTORE,
  /**
   * Add a new element into the vector set specified by key
   *
   * @param key - The name of the key that will hold the vector set data
   * @param vector - The vector data as array of numbers
   * @param element - The name of the element being added to the vector set
   * @param options - Optional parameters for vector addition
   * @see https://redis.io/commands/vadd/
   */
  VADD,
  /**
   * Add a new element into the vector set specified by key
   *
   * @param key - The name of the key that will hold the vector set data
   * @param vector - The vector data as array of numbers
   * @param element - The name of the element being added to the vector set
   * @param options - Optional parameters for vector addition
   * @see https://redis.io/commands/vadd/
   */
  vAdd: VADD,
  /**
   * Retrieve the number of elements in a vector set
   *
   * @param key - The key of the vector set
   * @see https://redis.io/commands/vcard/
   */
  VCARD,
  /**
   * Retrieve the number of elements in a vector set
   *
   * @param key - The key of the vector set
   * @see https://redis.io/commands/vcard/
   */
  vCard: VCARD,
  /**
   * Retrieve the dimension of the vectors in a vector set
   *
   * @param key - The key of the vector set
   * @see https://redis.io/commands/vdim/
   */
  VDIM,
  /**
   * Retrieve the dimension of the vectors in a vector set
   *
   * @param key - The key of the vector set
   * @see https://redis.io/commands/vdim/
   */
  vDim: VDIM,
  /**
   * Retrieve the approximate vector associated with a vector set element
   *
   * @param key - The key of the vector set
   * @param element - The name of the element to retrieve the vector for
   * @see https://redis.io/commands/vemb/
   */
  VEMB,
  /**
   * Retrieve the approximate vector associated with a vector set element
   *
   * @param key - The key of the vector set
   * @param element - The name of the element to retrieve the vector for
   * @see https://redis.io/commands/vemb/
   */
  vEmb: VEMB,
  /**
   * Retrieve the RAW approximate vector associated with a vector set element
   *
   * @param key - The key of the vector set
   * @param element - The name of the element to retrieve the vector for
   * @see https://redis.io/commands/vemb/
   */
  VEMB_RAW,
  /**
   * Retrieve the RAW approximate vector associated with a vector set element
   *
   * @param key - The key of the vector set
   * @param element - The name of the element to retrieve the vector for
   * @see https://redis.io/commands/vemb/
   */
  vEmbRaw: VEMB_RAW,
  /**
   * Retrieve the attributes of a vector set element
   *
   * @param key - The key of the vector set
   * @param element - The name of the element to retrieve attributes for
   * @see https://redis.io/commands/vgetattr/
   */
  VGETATTR,
  /**
   * Retrieve the attributes of a vector set element
   *
   * @param key - The key of the vector set
   * @param element - The name of the element to retrieve attributes for
   * @see https://redis.io/commands/vgetattr/
   */
  vGetAttr: VGETATTR,
  /**
   * Retrieve metadata and internal details about a vector set, including size, dimensions, quantization type, and graph structure
   *
   * @param key - The key of the vector set
   * @see https://redis.io/commands/vinfo/
   */
  VINFO,
  /**
   * Retrieve metadata and internal details about a vector set, including size, dimensions, quantization type, and graph structure
   *
   * @param key - The key of the vector set
   * @see https://redis.io/commands/vinfo/
   */
  vInfo: VINFO,
  /**
   * Retrieve the neighbors of a specified element in a vector set; the connections for each layer of the HNSW graph
   *
   * @param key - The key of the vector set
   * @param element - The name of the element to retrieve neighbors for
   * @see https://redis.io/commands/vlinks/
   */
  VLINKS,
  /**
   * Retrieve the neighbors of a specified element in a vector set; the connections for each layer of the HNSW graph
   *
   * @param key - The key of the vector set
   * @param element - The name of the element to retrieve neighbors for
   * @see https://redis.io/commands/vlinks/
   */
  vLinks: VLINKS,
  /**
   * Get the connections for each layer of the HNSW graph with similarity scores
   * @param args - Same parameters as the VLINKS command
   * @see https://redis.io/commands/vlinks/
   */
  VLINKS_WITHSCORES,
  /**
   * Get the connections for each layer of the HNSW graph with similarity scores
   * @param args - Same parameters as the VLINKS command
   * @see https://redis.io/commands/vlinks/
   */
  vLinksWithScores: VLINKS_WITHSCORES,
  /**
   * Retrieve random elements of a vector set
   *
   * @param key - The key of the vector set
   * @param count - Optional number of elements to return
   * @see https://redis.io/commands/vrandmember/
   */
  VRANDMEMBER,
  /**
   * Retrieve random elements of a vector set
   *
   * @param key - The key of the vector set
   * @param count - Optional number of elements to return
   * @see https://redis.io/commands/vrandmember/
   */
  vRandMember: VRANDMEMBER,
  /**
   * Returns elements in a lexicographical range from a vector set.
   * Provides a stateless iterator for elements inside a vector set.
   *
   * @param key - The key of the vector set
   * @param start - The starting point of the lexicographical range.
   *                Can be a string prefixed with `[` for inclusive (e.g., `[Redis`),
   *                `(` for exclusive (e.g., `(a7`), or `-` for the minimum element.
   * @param end - The ending point of the lexicographical range.
   *              Can be a string prefixed with `[` for inclusive,
   *              `(` for exclusive, or `+` for the maximum element.
   * @param count - Optional maximum number of elements to return.
   *                If negative, returns all elements in the specified range.
   * @see https://redis.io/commands/vrange/
   */
  VRANGE,
  /**
   * Returns elements in a lexicographical range from a vector set.
   * Provides a stateless iterator for elements inside a vector set.
   *
   * @param key - The key of the vector set
   * @param start - The starting point of the lexicographical range.
   *                Can be a string prefixed with `[` for inclusive (e.g., `[Redis`),
   *                `(` for exclusive (e.g., `(a7`), or `-` for the minimum element.
   * @param end - The ending point of the lexicographical range.
   *              Can be a string prefixed with `[` for inclusive,
   *              `(` for exclusive, or `+` for the maximum element.
   * @param count - Optional maximum number of elements to return.
   *                If negative, returns all elements in the specified range.
   * @see https://redis.io/commands/vrange/
   */
  vRange: VRANGE,
  /**
   * Remove an element from a vector set
   *
   * @param key - The key of the vector set
   * @param element - The name of the element to remove from the vector set
   * @see https://redis.io/commands/vrem/
   */
  VREM,
  /**
   * Remove an element from a vector set
   *
   * @param key - The key of the vector set
   * @param element - The name of the element to remove from the vector set
   * @see https://redis.io/commands/vrem/
   */
  vRem: VREM,
  /**
   * Set or replace attributes on a vector set element
   *
   * @param key - The key of the vector set
   * @param element - The name of the element to set attributes for
   * @param attributes - The attributes to set (as JSON string or object)
   * @see https://redis.io/commands/vsetattr/
   */
  VSETATTR,
  /**
   * Set or replace attributes on a vector set element
   *
   * @param key - The key of the vector set
   * @param element - The name of the element to set attributes for
   * @param attributes - The attributes to set (as JSON string or object)
   * @see https://redis.io/commands/vsetattr/
   */
  vSetAttr: VSETATTR,
  /**
   * Retrieve elements similar to a given vector or element with optional filtering
   *
   * @param key - The key of the vector set
   * @param query - The query vector (array of numbers) or element name (string)
   * @param options - Optional parameters for similarity search
   * @see https://redis.io/commands/vsim/
   */
  VSIM,
  /**
   * Retrieve elements similar to a given vector or element with optional filtering
   *
   * @param key - The key of the vector set
   * @param query - The query vector (array of numbers) or element name (string)
   * @param options - Optional parameters for similarity search
   * @see https://redis.io/commands/vsim/
   */
  vSim: VSIM,
  /**
   * Retrieve elements similar to a given vector or element with similarity scores
   * @param args - Same parameters as the VSIM command
   * @see https://redis.io/commands/vsim/
   */
  VSIM_WITHSCORES,
  /**
   * Retrieve elements similar to a given vector or element with similarity scores
   * @param args - Same parameters as the VSIM command
   * @see https://redis.io/commands/vsim/
   */
  vSimWithScores: VSIM_WITHSCORES
} as const satisfies RedisCommands;

// Commands available for cluster clients (excludes commands that require session affinity)
import COMMANDS from './index';

// TODO: Remove this workaround once the cluster properly implements session affinity (sticky connections).
// HOTKEYS commands require a sticky connection to a single Redis node to function correctly.
const {
  HOTKEYS_GET: _HOTKEYS_GET,
  hotkeysGet: _hotkeysGet,
  HOTKEYS_RESET: _HOTKEYS_RESET,
  hotkeysReset: _hotkeysReset,
  HOTKEYS_START: _HOTKEYS_START,
  hotkeysStart: _hotkeysStart,
  HOTKEYS_STOP: _HOTKEYS_STOP,
  hotkeysStop: _hotkeysStop,
  ...NON_STICKY_COMMANDS
} = COMMANDS;

export { NON_STICKY_COMMANDS };
