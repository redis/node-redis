import ACL_CAT from './ACL_CAT';
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
import CLIENT_CACHING from './CLIENT_CACHING';
import CLIENT_GETNAME from './CLIENT_GETNAME';
import CLIENT_GETREDIR from './CLIENT_GETREDIR';
import CLIENT_ID from './CLIENT_ID';
import CLIENT_INFO from './CLIENT_INFO';
import CLIENT_KILL from './CLIENT_KILL';
import CLIENT_LIST from './CLIENT_LIST';
import CLIENT_NO_EVICT from './CLIENT_NO-EVICT';
import CLIENT_PAUSE from './CLIENT_PAUSE';
import CLIENT_SETNAME from './CLIENT_SETNAME';
import CLUSTER_ADDSLOTS from './CLUSTER_ADDSLOTS';
import CLUSTER_SLOTS from './CLUSTER_SLOTS';
import CLUSTER_MEET from './CLUSTER_MEET';
import CLUSTER_MYID from './CLUSTER_MYID';
import CLUSTER_REPLICATE from './CLUSTER_REPLICATE';
import COPY from './COPY';
import DBSIZE from './DBSIZE';
import DECR from './DECR';
import DECRBY from './DECRBY';
import DEL from './DEL';
import DUMP from './DUMP';
import ECHO from './ECHO';
import EVAL_RO from './EVAL_RO';
import EVAL from './EVAL';
import EVALSHA_RO from './EVALSHA_RO';
import EVALSHA from './EVALSHA';
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
import FLUSHALL from './FLUSHALL';
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
// import FUNCTION_RESTORE from './FUNCTION_RESTORE';
// import FUNCTION_STATS from './FUNCTION_STATS';
import HDEL from './HDEL';
import HELLO from './HELLO';
import HEXISTS from './HEXISTS';
import HGET from './HGET';
import HGETALL from './HGETALL';
import HINCRBY from './HINCRBY';
import HINCRBYFLOAT from './HINCRBYFLOAT';
import HKEYS from './HKEYS';
import HLEN from './HLEN';
import HMGET from './HMGET';
import HRANDFIELD_COUNT_WITHVALUES from './HRANDFIELD_COUNT_WITHVALUES';
import HRANDFIELD_COUNT from './HRANDFIELD_COUNT';
import HRANDFIELD from './HRANDFIELD';
import HSCAN from './HSCAN';
import HSET from './HSET';
import HSETNX from './HSETNX';
import HSTRLEN from './HSTRLEN';
import HVALS from './HVALS';
import INCR from './INCR';
import INCRBY from './INCRBY';
import INCRBYFLOAT from './INCRBYFLOAT';
import INFO from './INFO';
import KEYS from './KEYS';
import LASTSAVE from './LASTSAVE';
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
// import MEMORY_STATS from './MEMORY_STATS';
import MEMORY_USAGE from './MEMORY_USAGE';
import MGET from './MGET';
import MODULE_LIST from './MODULE_LIST';
import MODULE_LOAD from './MODULE_LOAD';
import MODULE_UNLOAD from './MODULE_UNLOAD';
import MOVE from './MOVE';
import MSET from './MSET';
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
import PUBSUB_SHARDCHANNELS from './PUBSUB_SHARDCHANNELS';
import RANDOMKEY from './RANDOMKEY';
import READONLY from './READONLY';
import RENAME from './RENAME';
import RENAMENX from './RENAMENX';
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
import TOUCH from './TOUCH';
import TTL from './TTL';
import TYPE from './TYPE';
import UNLINK from './UNLINK';
import UNWATCH from './UNWATCH';
import WAIT from './WAIT';
import WATCH from './WATCH';
import XACK from './XACK';
import XADD_NOMKSTREAM from './XADD_NOMKSTREAM';
import XADD from './XADD';
import XDEL from './XDEL';
import XSETID from './XSETID';
import XTRIM from './XTRIM';
import XLEN from './XLEN';
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
import ZMSCORE from './ZMSCORE';
import ZRANDMEMBER_COUNT_WITHSCORES from './ZRANDMEMBER_COUNT_WITHSCORES';
import ZRANDMEMBER_COUNT from './ZRANDMEMBER_COUNT';
import ZRANDMEMBER from './ZRANDMEMBER';
import ZRANGE from './ZRANGE';
import ZRANGEBYLEX from './ZRANGEBYLEX';
import ZRANGEBYSCORE_WITHSCORES from './ZRANGEBYSCORE_WITHSCORES';
import ZRANGEBYSCORE from './ZRANGEBYSCORE';
import ZREMRANGEBYSCORE from './ZREMRANGEBYSCORE';
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
import { Command } from '../RESP/types';

type ACL_CAT = typeof import('./ACL_CAT').default;
type ACL_DRYRUN = typeof import('./ACL_DRYRUN').default;
type ACL_GENPASS = typeof import('./ACL_GENPASS').default;
type ACL_GETUSER = typeof import('./ACL_GETUSER').default;
type ACL_LIST = typeof import('./ACL_LIST').default;
type ACL_LOAD = typeof import('./ACL_LOAD').default;
type ACL_LOG_RESET = typeof import('./ACL_LOG_RESET').default;
type ACL_LOG = typeof import('./ACL_LOG').default;
type ACL_SAVE = typeof import('./ACL_SAVE').default;
type ACL_SETUSER = typeof import('./ACL_SETUSER').default;
type ACL_USERS = typeof import('./ACL_USERS').default;
type ACL_WHOAMI = typeof import('./ACL_WHOAMI').default;
type APPEND = typeof import('./APPEND').default;
type ASKING = typeof import('./ASKING').default;
type AUTH = typeof import('./AUTH').default;
type BGREWRITEAOF = typeof import('./BGREWRITEAOF').default;
type BGSAVE = typeof import('./BGSAVE').default;
type BITCOUNT = typeof import('./BITCOUNT').default;
type BITFIELD_RO = typeof import('./BITFIELD_RO').default;
type BITFIELD = typeof import('./BITFIELD').default;
type BITOP = typeof import('./BITOP').default;
type BITPOS = typeof import('./BITPOS').default;
type BLMOVE = typeof import('./BLMOVE').default;
type BLMPOP = typeof import('./BLMPOP').default;
type BLPOP = typeof import('./BLPOP').default;
type BRPOP = typeof import('./BRPOP').default;
type BRPOPLPUSH = typeof import('./BRPOPLPUSH').default;
type CLIENT_CACHING = typeof import('./CLIENT_CACHING').default;
type CLIENT_GETNAME = typeof import('./CLIENT_GETNAME').default;
type CLIENT_GETREDIR = typeof import('./CLIENT_GETREDIR').default;
type CLIENT_ID = typeof import('./CLIENT_ID').default;
type CLIENT_INFO = typeof import('./CLIENT_INFO').default;
type CLIENT_KILL = typeof import('./CLIENT_KILL').default;
type CLIENT_LIST = typeof import('./CLIENT_LIST').default;
type CLIENT_NO_EVICT = typeof import('./CLIENT_NO-EVICT').default;
type CLIENT_PAUSE = typeof import('./CLIENT_PAUSE').default;
type CLIENT_SETNAME = typeof import('./CLIENT_SETNAME').default;
type CLUSTER_ADDSLOTS = typeof import('./CLUSTER_ADDSLOTS').default;
type CLUSTER_SLOTS = typeof import('./CLUSTER_SLOTS').default;
type CLUSTER_MEET = typeof import('./CLUSTER_MEET').default;
type CLUSTER_MYID = typeof import('./CLUSTER_MYID').default;
type CLUSTER_REPLICATE = typeof import('./CLUSTER_REPLICATE').default;
type COPY = typeof import('./COPY').default;
type DBSIZE = typeof DBSIZE;
type DECR = typeof import('./DECR').default;
type DECRBY = typeof import('./DECRBY').default;
type DEL = typeof import('./DEL').default;
type DUMP = typeof import('./DUMP').default;
type ECHO = typeof import('./ECHO').default;
type EVAL_RO = typeof import('./EVAL_RO').default;
type EVAL = typeof import('./EVAL').default;
type EVALSHA_RO = typeof import('./EVALSHA_RO').default;
type EVALSHA = typeof import('./EVALSHA').default;
type GEOADD = typeof import('./GEOADD').default;
type GEODIST = typeof import('./GEODIST').default;
type GEOHASH = typeof import('./GEOHASH').default;
type GEOPOS = typeof import('./GEOPOS').default;
type GEORADIUS_RO_WITH = typeof import('./GEORADIUS_RO_WITH').default;
type GEORADIUS_RO = typeof import('./GEORADIUS_RO').default;
type GEORADIUS_STORE = typeof import('./GEORADIUS_STORE').default;
type GEORADIUS_WITH = typeof import('./GEORADIUS_WITH').default;
type GEORADIUS = typeof import('./GEORADIUS').default;
type GEORADIUSBYMEMBER_RO_WITH = typeof import('./GEORADIUSBYMEMBER_RO_WITH').default;
type GEORADIUSBYMEMBER_RO = typeof import('./GEORADIUSBYMEMBER_RO').default;
type GEORADIUSBYMEMBER_STORE = typeof import('./GEORADIUSBYMEMBER_STORE').default;
type GEORADIUSBYMEMBER_WITH = typeof import('./GEORADIUSBYMEMBER_WITH').default;
type GEORADIUSBYMEMBER = typeof import('./GEORADIUSBYMEMBER').default;
type GEOSEARCH_WITH = typeof import('./GEOSEARCH_WITH').default;
type GEOSEARCH = typeof import('./GEOSEARCH').default;
type GEOSEARCHSTORE = typeof import('./GEOSEARCHSTORE').default;
type GET = typeof import('./GET').default;
type GETBIT = typeof import('./GETBIT').default;
type GETDEL = typeof import('./GETDEL').default;
type GETEX = typeof import('./GETEX').default;
type GETRANGE = typeof import('./GETRANGE').default;
type GETSET = typeof import('./GETSET').default;
type EXISTS = typeof import('./EXISTS').default;
type EXPIRE = typeof import('./EXPIRE').default;
type EXPIREAT = typeof import('./EXPIREAT').default;
type EXPIRETIME = typeof import('./EXPIRETIME').default;
type FLUSHALL = typeof import('./FLUSHALL').default;
type FLUSHDB = typeof import('./FLUSHDB').default;
type FCALL = typeof import('./FCALL').default;
type FCALL_RO = typeof import('./FCALL_RO').default;
type FUNCTION_DELETE = typeof import('./FUNCTION_DELETE').default;
type FUNCTION_DUMP = typeof import('./FUNCTION_DUMP').default;
type FUNCTION_FLUSH = typeof import('./FUNCTION_FLUSH').default;
type FUNCTION_KILL = typeof import('./FUNCTION_KILL').default;
type FUNCTION_LIST_WITHCODE = typeof import('./FUNCTION_LIST_WITHCODE').default;
type FUNCTION_LIST = typeof import('./FUNCTION_LIST').default;
type FUNCTION_LOAD = typeof import('./FUNCTION_LOAD').default;
// type FUNCTION_RESTORE = typeof import('./FUNCTION_RESTORE').default;
// type FUNCTION_STATS = typeof import('./FUNCTION_STATS').default;
type HDEL = typeof import('./HDEL').default;
type HELLO = typeof import('./HELLO').default;
type HEXISTS = typeof import('./HEXISTS').default;
type HGET = typeof import('./HGET').default;
type HGETALL = typeof import('./HGETALL').default;
type HINCRBY = typeof import('./HINCRBY').default;
type HINCRBYFLOAT = typeof import('./HINCRBYFLOAT').default;
type HKEYS = typeof import('./HKEYS').default;
type HLEN = typeof import('./HLEN').default;
type HMGET = typeof import('./HMGET').default;
type HRANDFIELD_COUNT_WITHVALUES = typeof import('./HRANDFIELD_COUNT_WITHVALUES').default;
type HRANDFIELD_COUNT = typeof import('./HRANDFIELD_COUNT').default;
type HRANDFIELD = typeof import('./HRANDFIELD').default;
type HSCAN = typeof import('./HSCAN').default;
type HSET = typeof import('./HSET').default;
type HSETNX = typeof import('./HSETNX').default;
type HSTRLEN = typeof import('./HSTRLEN').default;
type HVALS = typeof import('./HVALS').default;
type INCR = typeof import('./INCR').default;
type INCRBY = typeof import('./INCRBY').default;
type INCRBYFLOAT = typeof import('./INCRBYFLOAT').default;
type INFO = typeof import('./INFO').default;
type KEYS = typeof import('./KEYS').default;
type LASTSAVE = typeof import('./LASTSAVE').default;
type LCS_IDX_WITHMATCHLEN = typeof import('./LCS_IDX_WITHMATCHLEN').default;
type LCS_IDX = typeof import('./LCS_IDX').default;
type LCS_LEN = typeof import('./LCS_LEN').default;
type LCS = typeof import('./LCS').default;
type LINDEX = typeof import('./LINDEX').default;
type LINSERT = typeof import('./LINSERT').default;
type LLEN = typeof import('./LLEN').default;
type LMOVE = typeof import('./LMOVE').default;
type LMPOP = typeof import('./LMPOP').default;
type LOLWUT = typeof import('./LOLWUT').default;
type LPOP_COUNT = typeof import('./LPOP_COUNT').default;
type LPOP = typeof import('./LPOP').default;
type LPOS_COUNT = typeof import('./LPOS_COUNT').default;
type LPOS = typeof import('./LPOS').default;
type LPUSH = typeof import('./LPUSH').default;
type LPUSHX = typeof import('./LPUSHX').default;
type LRANGE = typeof import('./LRANGE').default;
type LREM = typeof import('./LREM').default;
type LSET = typeof import('./LSET').default;
type LTRIM = typeof import('./LTRIM').default;
type MEMORY_DOCTOR = typeof import('./MEMORY_DOCTOR').default;
type MEMORY_MALLOC_STATS = typeof import('./MEMORY_MALLOC-STATS').default;
type MEMORY_PURGE = typeof import('./MEMORY_PURGE').default;
// type MEMORY_STATS = typeof import('./MEMORY_STATS').default;
type MEMORY_USAGE = typeof import('./MEMORY_USAGE').default;
type MGET = typeof import('./MGET').default;
type MODULE_LIST = typeof import('./MODULE_LIST').default;
type MODULE_LOAD = typeof import('./MODULE_LOAD').default;
type MODULE_UNLOAD = typeof import('./MODULE_UNLOAD').default;
type MOVE = typeof import('./MOVE').default;
type MSET = typeof import('./MSET').default;
type MSETNX = typeof import('./MSETNX').default;
type OBJECT_ENCODING = typeof import('./OBJECT_ENCODING').default;
type OBJECT_FREQ = typeof import('./OBJECT_FREQ').default;
type OBJECT_IDLETIME = typeof import('./OBJECT_IDLETIME').default;
type OBJECT_REFCOUNT = typeof import('./OBJECT_REFCOUNT').default;
type PERSIST = typeof import('./PERSIST').default;
type PEXPIRE = typeof import('./PEXPIRE').default;
type PEXPIREAT = typeof import('./PEXPIREAT').default;
type PEXPIRETIME = typeof import('./PEXPIRETIME').default;
type PFADD = typeof import('./PFADD').default;
type PFCOUNT = typeof import('./PFCOUNT').default;
type PFMERGE = typeof import('./PFMERGE').default;
type PING = typeof import('./PING').default;
type PSETEX = typeof import('./PSETEX').default;
type PTTL = typeof import('./PTTL').default;
type PUBLISH = typeof import('./PUBLISH').default;
type PUBSUB_CHANNELS = typeof import('./PUBSUB_CHANNELS').default;
type PUBSUB_NUMPAT = typeof import('./PUBSUB_NUMPAT').default;
type PUBSUB_NUMSUB = typeof import('./PUBSUB_NUMSUB').default;
type PUBSUB_SHARDCHANNELS = typeof import('./PUBSUB_SHARDCHANNELS').default;
type RANDOMKEY = typeof import('./RANDOMKEY').default;
type READONLY = typeof import('./READONLY').default;
type RENAME = typeof import('./RENAME').default;
type RENAMENX = typeof import('./RENAMENX').default;
type RPOP_COUNT = typeof import('./RPOP_COUNT').default;
type RPOP = typeof import('./RPOP').default;
type RPOPLPUSH = typeof import('./RPOPLPUSH').default;
type RPUSH = typeof import('./RPUSH').default;
type RPUSHX = typeof import('./RPUSHX').default;
type SADD = typeof import('./SADD').default;
type SCAN = typeof import('./SCAN').default;
type SCARD = typeof import('./SCARD').default;
type SCRIPT_DEBUG = typeof import('./SCRIPT_DEBUG').default;
type SCRIPT_EXISTS = typeof import('./SCRIPT_EXISTS').default;
type SCRIPT_FLUSH = typeof import('./SCRIPT_FLUSH').default;
type SCRIPT_KILL = typeof import('./SCRIPT_KILL').default;
type SCRIPT_LOAD = typeof import('./SCRIPT_LOAD').default;
type SDIFF = typeof import('./SDIFF').default;
type SDIFFSTORE = typeof import('./SDIFFSTORE').default;
type SET = typeof import('./SET').default;
type SETBIT = typeof import('./SETBIT').default;
type SETEX = typeof import('./SETEX').default;
type SETNX = typeof import('./SETNX').default;
type SETRANGE = typeof import('./SETRANGE').default;
type SINTER = typeof import('./SINTER').default;
type SINTERCARD = typeof import('./SINTERCARD').default;
type SINTERSTORE = typeof import('./SINTERSTORE').default;
type SISMEMBER = typeof import('./SISMEMBER').default;
type SMEMBERS = typeof import('./SMEMBERS').default;
type SMISMEMBER = typeof import('./SMISMEMBER').default;
type SMOVE = typeof import('./SMOVE').default;
type SORT_RO = typeof import('./SORT_RO').default;
type SORT_STORE = typeof import('./SORT_STORE').default;
type SORT = typeof import('./SORT').default;
type SPOP_COUNT = typeof import('./SPOP_COUNT').default;
type SPOP = typeof import('./SPOP').default;
type SPUBLISH = typeof import('./SPUBLISH').default;
type SRANDMEMBER_COUNT = typeof import('./SRANDMEMBER_COUNT').default;
type SRANDMEMBER = typeof import('./SRANDMEMBER').default;
type SREM = typeof import('./SREM').default;
type SSCAN = typeof import('./SSCAN').default;
type STRLEN = typeof import('./STRLEN').default;
type SUNION = typeof import('./SUNION').default;
type SUNIONSTORE = typeof import('./SUNIONSTORE').default;
type TOUCH = typeof import('./TOUCH').default;
type TTL = typeof import('./TTL').default;
type TYPE = typeof import('./TYPE').default;
type UNLINK = typeof import('./UNLINK').default;
type UNWATCH = typeof import('./UNWATCH').default;
type WAIT = typeof import('./WAIT').default;
type WATCH = typeof import('./WATCH').default;
type XACK = typeof import('./XACK').default;
type XADD_NOMKSTREAM = typeof import('./XADD_NOMKSTREAM').default;
type XADD = typeof import('./XADD').default;
type XDEL = typeof import('./XDEL').default;
type XSETID = typeof import('./XSETID').default;
type XTRIM = typeof import('./XTRIM').default;
type XLEN = typeof import('./XLEN').default;
type ZADD_INCR = typeof import('./ZADD_INCR').default;
type ZADD = typeof import('./ZADD').default;
type ZCARD = typeof import('./ZCARD').default;
type ZCOUNT = typeof import('./ZCOUNT').default;
type ZDIFF_WITHSCORES = typeof import('./ZDIFF_WITHSCORES').default;
type ZDIFF = typeof import('./ZDIFF').default;
type ZDIFFSTORE = typeof import('./ZDIFFSTORE').default;
type ZINCRBY = typeof import('./ZINCRBY').default;
type ZINTER_WITHSCORES = typeof import('./ZINTER_WITHSCORES').default;
type ZINTER = typeof import('./ZINTER').default;
type ZINTERCARD = typeof import('./ZINTERCARD').default;
type ZINTERSTORE = typeof import('./ZINTERSTORE').default;
type ZLEXCOUNT = typeof import('./ZLEXCOUNT').default;
type ZMSCORE = typeof import('./ZMSCORE').default;
type ZRANDMEMBER_COUNT_WITHSCORES = typeof import('./ZRANDMEMBER_COUNT_WITHSCORES').default;
type ZRANDMEMBER_COUNT = typeof import('./ZRANDMEMBER_COUNT').default;
type ZRANDMEMBER = typeof import('./ZRANDMEMBER').default;
type ZRANGE = typeof import('./ZRANGE').default;
type ZRANGEBYLEX = typeof import('./ZRANGEBYLEX').default;
type ZRANGEBYSCORE_WITHSCORES = typeof import('./ZRANGEBYSCORE_WITHSCORES').default;
type ZRANGEBYSCORE = typeof import('./ZRANGEBYSCORE').default;
type ZREMRANGEBYSCORE = typeof import('./ZREMRANGEBYSCORE').default;
type ZRANK = typeof import('./ZRANK').default;
type ZREM = typeof import('./ZREM').default;
type ZREMRANGEBYLEX = typeof import('./ZREMRANGEBYLEX').default;
type ZREMRANGEBYRANK = typeof import('./ZREMRANGEBYRANK').default;
type ZREVRANK = typeof import('./ZREVRANK').default;
type ZSCAN = typeof import('./ZSCAN').default;
type ZSCORE = typeof import('./ZSCORE').default;
type ZUNION_WITHSCORES = typeof import('./ZUNION_WITHSCORES').default;
type ZUNION = typeof import('./ZUNION').default;
type ZUNIONSTORE = typeof import('./ZUNIONSTORE').default;

type Commands = {
  ACL_CAT: ACL_CAT;
  aclCat: ACL_CAT;
  ACL_DRYRUN: ACL_DRYRUN;
  aclDryRun: ACL_DRYRUN;
  ACL_GENPASS: ACL_GENPASS;
  aclGenPass: ACL_GENPASS;
  ACL_GETUSER: ACL_GETUSER;
  aclGetUser: ACL_GETUSER;
  ACL_LIST: ACL_LIST;
  aclList: ACL_LIST;
  ACL_LOAD: ACL_LOAD;
  aclLoad: ACL_LOAD;
  ACL_LOG_RESET: ACL_LOG_RESET;
  aclLogReset: ACL_LOG_RESET;
  ACL_LOG: ACL_LOG;
  aclLog: ACL_LOG;
  ACL_SAVE: ACL_SAVE;
  aclSave: ACL_SAVE;
  ACL_SETUSER: ACL_SETUSER;
  aclSetUser: ACL_SETUSER;
  ACL_USERS: ACL_USERS;
  aclUsers: ACL_USERS;
  ACL_WHOAMI: ACL_WHOAMI;
  aclWhoAmI: ACL_WHOAMI;
  APPEND: APPEND;
  append: APPEND;
  ASKING: ASKING;
  asking: ASKING;
  AUTH: AUTH;
  auth: AUTH;
  BGREWRITEAOF: BGREWRITEAOF;
  bgRewriteAof: BGREWRITEAOF;
  BGSAVE: BGSAVE;
  bgSave: BGSAVE;
  BITCOUNT: BITCOUNT;
  bitCount: BITCOUNT;
  BITFIELD_RO: BITFIELD_RO;
  bitFieldRo: BITFIELD_RO;
  BITFIELD: BITFIELD;
  bitField: BITFIELD;
  BITOP: BITOP;
  bitOp: BITOP;
  BITPOS: BITPOS;
  bitPos: BITPOS;
  BLMOVE: BLMOVE;
  blMove: BLMOVE;
  BLMPOP: BLMPOP;
  blmPop: BLMPOP;
  BLPOP: BLPOP;
  blPop: BLPOP;
  BRPOP: BRPOP;
  brPop: BRPOP;
  BRPOPLPUSH: BRPOPLPUSH;
  brPopLPush: BRPOPLPUSH;
  CLIENT_CACHING: CLIENT_CACHING;
  clientCaching: CLIENT_CACHING;
  CLIENT_GETNAME: CLIENT_GETNAME;
  clientGetName: CLIENT_GETNAME;
  CLIENT_GETREDIR: CLIENT_GETREDIR;
  clientGetRedir: CLIENT_GETREDIR;
  CLIENT_ID: CLIENT_ID;
  clientId: CLIENT_ID;
  CLIENT_INFO: CLIENT_INFO;
  clientInfo: CLIENT_INFO;
  CLIENT_KILL: CLIENT_KILL;
  clientKill: CLIENT_KILL;
  CLIENT_LIST: CLIENT_LIST;
  clientList: CLIENT_LIST;
  'CLIENT_NO-EVICT': CLIENT_NO_EVICT;
  clientNoEvict: CLIENT_NO_EVICT;
  CLIENT_PAUSE: CLIENT_PAUSE;
  clientPause: CLIENT_PAUSE;
  CLIENT_SETNAME: CLIENT_SETNAME;
  clientSetName: CLIENT_SETNAME;
  CLUSTER_ADDSLOTS: CLUSTER_ADDSLOTS;
  clusterAddSlots: CLUSTER_ADDSLOTS;
  CLUSTER_SLOTS: CLUSTER_SLOTS;
  clusterSlots: CLUSTER_SLOTS;
  CLUSTER_MEET: CLUSTER_MEET;
  clusterMeet: CLUSTER_MEET;
  CLUSTER_MYID: CLUSTER_MYID;
  clusterMyId: CLUSTER_MYID;
  CLUSTER_REPLICATE: CLUSTER_REPLICATE;
  clusterReplicate: CLUSTER_REPLICATE;
  COPY: COPY;
  copy: COPY;
  DBSIZE: DBSIZE;
  dbSize: DBSIZE;
  DECR: DECR;
  decr: DECR;
  DECRBY: DECRBY;
  decrBy: DECRBY;
  DEL: DEL;
  del: DEL;
  DUMP: DUMP;
  dump: DUMP;
  ECHO: ECHO;
  echo: ECHO;
  EVAL_RO: EVAL_RO;
  evalRo: EVAL_RO;
  EVAL: EVAL;
  eval: EVAL;
  EVALSHA_RO: EVALSHA_RO;
  evalShaRo: EVALSHA_RO;
  EVALSHA: EVALSHA;
  evalSha: EVALSHA;
  EXISTS: EXISTS;
  exists: EXISTS;
  EXPIRE: EXPIRE;
  expire: EXPIRE;
  EXPIREAT: EXPIREAT;
  expireAt: EXPIREAT;
  EXPIRETIME: EXPIRETIME;
  expireTime: EXPIRETIME;
  FLUSHALL: FLUSHALL;
  flushAll: FLUSHALL;
  FLUSHDB: FLUSHDB;
  flushDb: FLUSHDB;
  FCALL: FCALL;
  fCall: FCALL;
  FCALL_RO: FCALL_RO;
  fCallRo: FCALL_RO;
  FUNCTION_DELETE: FUNCTION_DELETE;
  functionDelete: FUNCTION_DELETE;
  FUNCTION_DUMP: FUNCTION_DUMP;
  functionDump: FUNCTION_DUMP;
  FUNCTION_FLUSH: FUNCTION_FLUSH;
  functionFlush: FUNCTION_FLUSH;
  FUNCTION_KILL: FUNCTION_KILL;
  functionKill: FUNCTION_KILL;
  FUNCTION_LIST_WITHCODE: FUNCTION_LIST_WITHCODE;
  functionListWithCode: FUNCTION_LIST_WITHCODE;
  FUNCTION_LIST: FUNCTION_LIST;
  functionList: FUNCTION_LIST;
  FUNCTION_LOAD: FUNCTION_LOAD;
  functionLoad: FUNCTION_LOAD;
  // FUNCTION_RESTORE: FUNCTION_RESTORE;
  // functionRestore: FUNCTION_RESTORE;
  // FUNCTION_STATS: FUNCTION_STATS;
  // functionStats: FUNCTION_STATS;
  GEOADD: GEOADD;
  geoAdd: GEOADD;
  GEODIST: GEODIST;
  geoDist: GEODIST;
  GEOHASH: GEOHASH;
  geoHash: GEOHASH;
  GEOPOS: GEOPOS;
  geoPos: GEOPOS;
  GEORADIUS_RO_WITH: GEORADIUS_RO_WITH;
  geoRadiusRoWith: GEORADIUS_RO_WITH;
  GEORADIUS_RO: GEORADIUS_RO;
  geoRadiusRo: GEORADIUS_RO
  GEORADIUS_STORE: GEORADIUS_STORE;
  geoRadiusStore: GEORADIUS_STORE;
  GEORADIUS_WITH: GEORADIUS_WITH;
  geoRadiusWith: GEORADIUS_WITH;
  GEORADIUS: GEORADIUS;
  geoRadius: GEORADIUS;
  GEORADIUSBYMEMBER_RO_WITH: GEORADIUSBYMEMBER_RO_WITH;
  geoRadiusByMemberRoWith: GEORADIUSBYMEMBER_RO_WITH;
  GEORADIUSBYMEMBER_RO: GEORADIUSBYMEMBER_RO;
  geoRadiusByMemberRo: GEORADIUSBYMEMBER_RO;
  GEORADIUSBYMEMBER_STORE: GEORADIUSBYMEMBER_STORE;
  geoRadiusByMemberStore: GEORADIUSBYMEMBER_STORE;
  GEORADIUSBYMEMBER_WITH: GEORADIUSBYMEMBER_WITH;
  geoRadiusByMemberWith: GEORADIUSBYMEMBER_WITH;
  GEORADIUSBYMEMBER: GEORADIUSBYMEMBER;
  geoRadiusByMember: GEORADIUSBYMEMBER;
  GEOSEARCH_WITH: GEOSEARCH_WITH;
  geoSearchWith: GEOSEARCH_WITH;
  GEOSEARCH: GEOSEARCH;
  geoSearch: GEOSEARCH;
  GEOSEARCHSTORE: GEOSEARCHSTORE;
  geoSearchStore: GEOSEARCHSTORE;
  GET: GET;
  get: GET;
  GETBIT: GETBIT;
  getBit: GETBIT;
  GETDEL: GETDEL;
  getDel: GETDEL;
  GETEX: GETEX;
  getEx: GETEX;
  GETRANGE: GETRANGE;
  getRange: GETRANGE;
  GETSET: GETSET;
  getSet: GETSET;
  HDEL: HDEL;
  hDel: HDEL;
  HELLO: HELLO;
  hello: HELLO;
  HEXISTS: HEXISTS;
  hExists: HEXISTS;
  HGET: HGET;
  hGet: HGET;
  HGETALL: HGETALL;
  hGetAll: HGETALL;
  HINCRBY: HINCRBY;
  hIncrBy: HINCRBY;
  HINCRBYFLOAT: HINCRBYFLOAT;
  hIncrByFloat: HINCRBYFLOAT;
  HKEYS: HKEYS;
  hKeys: HKEYS;
  HLEN: HLEN;
  hLen: HLEN;
  HMGET: HMGET;
  hmGet: HMGET;
  HRANDFIELD_COUNT_WITHVALUES: HRANDFIELD_COUNT_WITHVALUES;
  hRandFieldCountWithValues: HRANDFIELD_COUNT_WITHVALUES;
  HRANDFIELD_COUNT: HRANDFIELD_COUNT;
  hRandFieldCount: HRANDFIELD_COUNT;
  HRANDFIELD: HRANDFIELD;
  hRandField: HRANDFIELD;
  HSCAN: HSCAN;
  hScan: HSCAN;
  HSET: HSET;
  hSet: HSET;
  HSETNX: HSETNX;
  hSetNX: HSETNX;
  HSTRLEN: HSTRLEN;
  hStrLen: HSTRLEN;
  HVALS: HVALS;
  hVals: HVALS;
  INCR: INCR;
  incr: INCR;
  INCRBY: INCRBY;
  incrBy: INCRBY;
  INCRBYFLOAT: INCRBYFLOAT;
  incrByFloat: INCRBYFLOAT;
  INFO: INFO;
  info: INFO;
  KEYS: KEYS;
  keys: KEYS;
  LASTSAVE: LASTSAVE;
  lastSave: LASTSAVE;
  LCS_IDX_WITHMATCHLEN: LCS_IDX_WITHMATCHLEN;
  lcsIdxWithMatchLen: LCS_IDX_WITHMATCHLEN;
  LCS_IDX: LCS_IDX;
  lcsIdx: LCS_IDX;
  LCS_LEN: LCS_LEN;
  lcsLen: LCS_LEN;
  LCS: LCS;
  lcs: LCS;
  LINDEX: LINDEX;
  lIndex: LINDEX;
  LINSERT: LINSERT;
  lInsert: LINSERT;
  LLEN: LLEN;
  lLen: LLEN;
  LMOVE: LMOVE;
  lMove: LMOVE;
  LMPOP: LMPOP;
  lmPop: LMPOP;
  LOLWUT: LOLWUT;
  LPOP_COUNT: LPOP_COUNT;
  lPopCount: LPOP_COUNT;
  LPOP: LPOP;
  lPop: LPOP;
  LPOS_COUNT: LPOS_COUNT;
  lPosCount: LPOS_COUNT;
  LPOS: LPOS;
  lPos: LPOS;
  LPUSH: LPUSH;
  lPush: LPUSH;
  LPUSHX: LPUSHX;
  lPushX: LPUSHX;
  LRANGE: LRANGE;
  lRange: LRANGE;
  LREM: LREM;
  lRem: LREM;
  LSET: LSET;
  lSet: LSET;
  LTRIM: LTRIM;
  lTrim: LTRIM;
  MEMORY_DOCTOR: MEMORY_DOCTOR;
  memoryDoctor: MEMORY_DOCTOR;
  'MEMORY_MALLOC-STATS': MEMORY_MALLOC_STATS;
  memoryMallocStats: MEMORY_MALLOC_STATS;
  MEMORY_PURGE: MEMORY_PURGE;
  memoryPurge: MEMORY_PURGE;
  // MEMORY_STATS: MEMORY_STATS;
  // memoryStats: MEMORY_STATS;
  MEMORY_USAGE: MEMORY_USAGE;
  memoryUsage: MEMORY_USAGE;
  MGET: MGET;
  mGet: MGET;
  MODULE_LIST: MODULE_LIST;
  moduleList: MODULE_LIST;
  MODULE_LOAD: MODULE_LOAD;
  moduleLoad: MODULE_LOAD;
  MODULE_UNLOAD: MODULE_UNLOAD;
  moduleUnload: MODULE_UNLOAD;
  MOVE: MOVE;
  move: MOVE;
  MSET: MSET;
  mSet: MSET;
  MSETNX: MSETNX;
  mSetNX: MSETNX;
  OBJECT_ENCODING: OBJECT_ENCODING;
  objectEncoding: OBJECT_ENCODING;
  OBJECT_FREQ: OBJECT_FREQ;
  objectFreq: OBJECT_FREQ;
  OBJECT_IDLETIME: OBJECT_IDLETIME;
  objectIdleTime: OBJECT_IDLETIME;
  OBJECT_REFCOUNT: OBJECT_REFCOUNT
  objectRefCount: OBJECT_REFCOUNT;
  PERSIST: PERSIST;
  persist: PERSIST;
  PEXPIRE: PEXPIRE;
  pExpire: PEXPIRE;
  PEXPIREAT: PEXPIREAT;
  pExpireAt: PEXPIREAT;
  PEXPIRETIME: PEXPIRETIME;
  pExpireTime: PEXPIRETIME;
  PFADD: PFADD;
  pfAdd: PFADD;
  PFCOUNT: PFCOUNT;
  pfCount: PFCOUNT;
  PFMERGE: PFMERGE;
  pfMerge: PFMERGE;
  PING: PING;
  /**
   * ping jsdoc
   */
  ping: PING;
  PSETEX: PSETEX;
  pSetEx: PSETEX;
  PTTL: PTTL;
  pTTL: PTTL;
  PUBLISH: PUBLISH;
  publish: PUBLISH;
  PUBSUB_CHANNELS: PUBSUB_CHANNELS;
  pubSubChannels: PUBSUB_CHANNELS;
  PUBSUB_NUMPAT: PUBSUB_NUMPAT;
  pubSubNumPat: PUBSUB_NUMPAT;
  PUBSUB_NUMSUB: PUBSUB_NUMSUB;
  pubSubNumSub: PUBSUB_NUMSUB;
  PUBSUB_SHARDCHANNELS: PUBSUB_SHARDCHANNELS;
  pubSubShardChannels: PUBSUB_SHARDCHANNELS;
  RANDOMKEY: RANDOMKEY;
  randomKey: RANDOMKEY;
  READONLY: READONLY;
  readonly: READONLY;
  RENAME: RENAME;
  rename: RENAME;
  RENAMENX: RENAMENX;
  renameNX: RENAMENX;
  RPOP_COUNT: RPOP_COUNT;
  rPopCount: RPOP_COUNT;
  RPOP: RPOP;
  rPop: RPOP;
  RPOPLPUSH: RPOPLPUSH;
  rPopLPush: RPOPLPUSH;
  RPUSH: RPUSH;
  rPush: RPUSH;
  RPUSHX: RPUSHX;
  rPushX: RPUSHX;
  SADD: SADD;
  sAdd: SADD;
  SCAN: SCAN;
  scan: SCAN;
  SCARD: SCARD;
  sCard: SCARD;
  SCRIPT_DEBUG: SCRIPT_DEBUG;
  scriptDebug: SCRIPT_DEBUG;
  SCRIPT_EXISTS: SCRIPT_EXISTS;
  scriptExists: SCRIPT_EXISTS;
  SCRIPT_FLUSH: SCRIPT_FLUSH;
  scriptFlush: SCRIPT_FLUSH;
  SCRIPT_KILL: SCRIPT_KILL;
  scriptKill: SCRIPT_KILL;
  SCRIPT_LOAD: SCRIPT_LOAD;
  scriptLoad: SCRIPT_LOAD;
  SDIFF: SDIFF;
  sDiff: SDIFF;
  SDIFFSTORE: SDIFFSTORE;
  sDiffStore: SDIFFSTORE;
  SET: SET;
  set: SET;
  SETBIT: SETBIT;
  setBit: SETBIT;
  SETEX: SETEX;
  setEx: SETEX;
  SETNX: SETNX;
  setNX: SETNX;
  SETRANGE: SETRANGE;
  setRange: SETRANGE;
  SINTER: SINTER;
  sInter: SINTER;
  SINTERCARD: SINTERCARD;
  sInterCard: SINTERCARD;
  SINTERSTORE: SINTERSTORE;
  sInterStore: SINTERSTORE;
  SISMEMBER: SISMEMBER;
  sIsMember: SISMEMBER;
  SMEMBERS: SMEMBERS;
  sMembers: SMEMBERS;
  SMISMEMBER: SMISMEMBER;
  smIsMember: SMISMEMBER;
  SMOVE: SMOVE;
  sMove: SMOVE;
  SORT_RO: SORT_RO;
  sortRo: SORT_RO;
  SORT_STORE: SORT_STORE;
  sortStore: SORT_STORE;
  SORT: SORT;
  sort: SORT;
  SPOP_COUNT: SPOP_COUNT;
  sPopCount: SPOP_COUNT;
  SPOP: SPOP;
  sPop: SPOP;
  SPUBLISH: SPUBLISH;
  sPublish: SPUBLISH;
  SRANDMEMBER_COUNT: SRANDMEMBER_COUNT;
  sRandMemberCount: SRANDMEMBER_COUNT;
  SRANDMEMBER: SRANDMEMBER;
  sRandMember: SRANDMEMBER;
  SREM: SREM;
  sRem: SREM;
  SSCAN: SSCAN;
  sScan: SSCAN;
  STRLEN: STRLEN;
  strLen: STRLEN;
  SUNION: SUNION;
  sUnion: SUNION;
  SUNIONSTORE: SUNIONSTORE;
  sUnionStore: SUNIONSTORE;
  TOUCH: TOUCH;
  touch: TOUCH;
  TTL: TTL;
  ttl: TTL;
  TYPE: TYPE;
  type: TYPE;
  UNLINK: UNLINK;
  unlink: UNLINK;
  UNWATCH: UNWATCH;
  unwatch: UNWATCH;
  WAIT: WAIT;
  wait: WAIT;
  WATCH: WATCH;
  watch: WATCH;
  XACK: XACK;
  xAck: XACK;
  XADD_NOMKSTREAM: XADD_NOMKSTREAM;
  xAddNoMkStream: XADD_NOMKSTREAM;
  XADD: XADD;
  xAdd: XADD;
  XDEL: XDEL;
  xDel: XDEL;
  XSETID: XSETID;
  xSetId: XSETID;
  XTRIM: XTRIM;
  xTrim: XTRIM;
  XLEN: XLEN;
  xLen: XLEN;
  ZADD_INCR: ZADD_INCR;
  zAddIncr: ZADD_INCR;
  ZADD: ZADD;
  zAdd: ZADD;
  ZCARD: ZCARD;
  zCard: ZCARD;
  ZCOUNT: ZCOUNT;
  zCount: ZCOUNT;
  ZDIFF_WITHSCORES: ZDIFF_WITHSCORES;
  zDiffWithScores: ZDIFF_WITHSCORES;
  ZDIFF: ZDIFF;
  zDiff: ZDIFF;
  ZDIFFSTORE: ZDIFFSTORE;
  zDiffStore: ZDIFFSTORE;
  ZINCRBY: ZINCRBY;
  zIncrBy: ZINCRBY;
  ZINTER_WITHSCORES: ZINTER_WITHSCORES;
  zInterWithScores: ZINTER_WITHSCORES;
  ZINTER: ZINTER;
  zInter: ZINTER;
  ZINTERCARD: ZINTERCARD;
  zInterCard: ZINTERCARD;
  ZINTERSTORE: ZINTERSTORE;
  zInterStore: ZINTERSTORE;
  ZLEXCOUNT: ZLEXCOUNT;
  zLexCount: ZLEXCOUNT;
  ZMSCORE: ZMSCORE;
  zmScore: ZMSCORE;
  ZRANDMEMBER_COUNT_WITHSCORES: ZRANDMEMBER_COUNT_WITHSCORES;
  zRandMemberCountWithScores: ZRANDMEMBER_COUNT_WITHSCORES;
  ZRANDMEMBER_COUNT: ZRANDMEMBER_COUNT;
  zRandMemberCount: ZRANDMEMBER_COUNT;
  ZRANDMEMBER: ZRANDMEMBER;
  zRandMember: ZRANDMEMBER;
  ZRANGE: ZRANGE;
  zRange: ZRANGE;
  ZRANGEBYLEX: ZRANGEBYLEX;
  zRangeByLex: ZRANGEBYLEX;
  ZRANGEBYSCORE_WITHSCORES: ZRANGEBYSCORE_WITHSCORES;
  zRangeByScoreWithScores: ZRANGEBYSCORE_WITHSCORES;
  ZRANGEBYSCORE: ZRANGEBYSCORE;
  zRangeByScore: ZRANGEBYSCORE;
  ZRANK: ZRANK;
  zRank: ZRANK;
  ZREM: ZREM;
  zRem: ZREM;
  ZREMRANGEBYLEX: ZREMRANGEBYLEX;
  zRemRangeByLex: ZREMRANGEBYLEX;
  ZREMRANGEBYRANK: ZREMRANGEBYRANK;
  zRemRangeByRank: ZREMRANGEBYRANK;
  ZREMRANGEBYSCORE: ZREMRANGEBYSCORE;
  zRemRangeByScore: ZREMRANGEBYSCORE;
  ZREVRANK: ZREVRANK;
  zRevRank: ZREVRANK;
  ZSCAN: ZSCAN;
  zScan: ZSCAN;
  ZSCORE: ZSCORE;
  zScore: ZSCORE;
  ZUNION_WITHSCORES: ZUNION_WITHSCORES;
  zUnionWithScores: ZUNION_WITHSCORES;
  ZUNION: ZUNION;
  zUnion: ZUNION;
  ZUNIONSTORE: ZUNIONSTORE;
  zUnionStore: ZUNIONSTORE;
};

export default {
  ACL_CAT,
  aclCat: ACL_CAT,
  ACL_DRYRUN,
  aclDryRun: ACL_DRYRUN,
  ACL_GENPASS,
  aclGenPass: ACL_GENPASS,
  ACL_GETUSER,
  aclGetUser: ACL_GETUSER,
  ACL_LIST,
  aclList: ACL_LIST,
  ACL_LOAD,
  aclLoad: ACL_LOAD,
  ACL_LOG_RESET,
  aclLogReset: ACL_LOG_RESET,
  ACL_LOG,
  aclLog: ACL_LOG,
  ACL_SAVE,
  aclSave: ACL_SAVE,
  ACL_SETUSER,
  aclSetUser: ACL_SETUSER,
  ACL_USERS,
  aclUsers: ACL_USERS,
  ACL_WHOAMI,
  aclWhoAmI: ACL_WHOAMI,
  APPEND,
  append: APPEND,
  ASKING,
  asking: ASKING,
  AUTH,
  auth: AUTH,
  BGREWRITEAOF,
  bgRewriteAof: BGREWRITEAOF,
  BGSAVE,
  bgSave: BGSAVE,
  BITCOUNT,
  bitCount: BITCOUNT,
  BITFIELD_RO,
  bitFieldRo: BITFIELD_RO,
  BITFIELD,
  bitField: BITFIELD,
  BITOP,
  bitOp: BITOP,
  BITPOS,
  bitPos: BITPOS,
  BLMOVE,
  blMove: BLMOVE,
  BLMPOP,
  blmPop: BLMPOP,
  BLPOP,
  blPop: BLPOP,
  BRPOP,
  brPop: BRPOP,
  BRPOPLPUSH,
  brPopLPush: BRPOPLPUSH,
  CLIENT_CACHING,
  clientCaching: CLIENT_CACHING,
  CLIENT_GETNAME,
  clientGetName: CLIENT_GETNAME,
  CLIENT_GETREDIR,
  clientGetRedir: CLIENT_GETREDIR,
  CLIENT_ID,
  clientId: CLIENT_ID,
  CLIENT_INFO,
  clientInfo: CLIENT_INFO,
  CLIENT_KILL,
  clientKill: CLIENT_KILL,
  CLIENT_LIST,
  clientList: CLIENT_LIST,
  'CLIENT_NO-EVICT': CLIENT_NO_EVICT,
  clientNoEvict: CLIENT_NO_EVICT,
  CLIENT_PAUSE,
  clientPause: CLIENT_PAUSE,
  CLIENT_SETNAME,
  clientSetName: CLIENT_SETNAME,
  CLUSTER_ADDSLOTS,
  clusterAddSlots: CLUSTER_ADDSLOTS,
  CLUSTER_SLOTS,
  clusterSlots: CLUSTER_SLOTS,
  CLUSTER_MEET,
  clusterMeet: CLUSTER_MEET,
  CLUSTER_MYID,
  clusterMyId: CLUSTER_MYID,
  CLUSTER_REPLICATE,
  clusterReplicate: CLUSTER_REPLICATE,
  COPY,
  copy: COPY,
  DBSIZE,
  dbSize: DBSIZE,
  DECR,
  decr: DECR,
  DECRBY,
  decrBy: DECRBY,
  DEL,
  del: DEL,
  DUMP,
  dump: DUMP,
  ECHO,
  echo: ECHO,
  EVAL_RO,
  evalRo: EVAL_RO,
  EVAL,
  eval: EVAL,
  EVALSHA_RO,
  evalShaRo: EVALSHA_RO,
  EVALSHA,
  evalSha: EVALSHA,
  EXISTS,
  exists: EXISTS,
  EXPIRE,
  expire: EXPIRE,
  EXPIREAT,
  expireAt: EXPIREAT,
  EXPIRETIME,
  expireTime: EXPIRETIME,
  FLUSHALL,
  flushAll: FLUSHALL,
  FLUSHDB,
  flushDb: FLUSHDB,
  FCALL,
  fCall: FCALL,
  FCALL_RO,
  fCallRo: FCALL_RO,
  FUNCTION_DELETE,
  functionDelete: FUNCTION_DELETE,
  FUNCTION_DUMP,
  functionDump: FUNCTION_DUMP,
  FUNCTION_FLUSH,
  functionFlush: FUNCTION_FLUSH,
  FUNCTION_KILL,
  functionKill: FUNCTION_KILL,
  FUNCTION_LIST_WITHCODE,
  functionListWithCode: FUNCTION_LIST_WITHCODE,
  FUNCTION_LIST,
  functionList: FUNCTION_LIST,
  FUNCTION_LOAD,
  functionLoad: FUNCTION_LOAD,
  // FUNCTION_RESTORE,
  // functionRestore: FUNCTION_RESTORE,
  // FUNCTION_STATS,
  // functionStats: FUNCTION_STATS,
  GEOADD,
  geoAdd: GEOADD,
  GEODIST,
  geoDist: GEODIST,
  GEOHASH,
  geoHash: GEOHASH,
  GEOPOS,
  geoPos: GEOPOS,
  GEORADIUS_RO_WITH,
  geoRadiusRoWith: GEORADIUS_RO_WITH,
  GEORADIUS_RO,
  geoRadiusRo: GEORADIUS_RO,
  GEORADIUS_STORE,
  geoRadiusStore: GEORADIUS_STORE,
  GEORADIUS_WITH,
  geoRadiusWith: GEORADIUS_WITH,
  GEORADIUS,
  geoRadius: GEORADIUS,
  GEORADIUSBYMEMBER_RO_WITH,
  geoRadiusByMemberRoWith: GEORADIUSBYMEMBER_RO_WITH,
  GEORADIUSBYMEMBER_RO,
  geoRadiusByMemberRo: GEORADIUSBYMEMBER_RO,
  GEORADIUSBYMEMBER_STORE,
  geoRadiusByMemberStore: GEORADIUSBYMEMBER_STORE,
  GEORADIUSBYMEMBER_WITH,
  geoRadiusByMemberWith: GEORADIUSBYMEMBER_WITH,
  GEORADIUSBYMEMBER,
  geoRadiusByMember: GEORADIUSBYMEMBER,
  GEOSEARCH_WITH,
  geoSearchWith: GEOSEARCH_WITH,
  GEOSEARCH,
  geoSearch: GEOSEARCH,
  GEOSEARCHSTORE,
  geoSearchStore: GEOSEARCHSTORE,
  GET,
  get: GET,
  GETBIT,
  getBit: GETBIT,
  GETDEL,
  getDel: GETDEL,
  GETEX,
  getEx: GETEX,
  GETRANGE,
  getRange: GETRANGE,
  GETSET,
  getSet: GETSET,
  HDEL,
  hDel: HDEL,
  HELLO,
  hello: HELLO,
  HEXISTS,
  hExists: HEXISTS,
  HGET,
  hGet: HGET,
  HGETALL,
  hGetAll: HGETALL,
  HINCRBY,
  hIncrBy: HINCRBY,
  HINCRBYFLOAT,
  hIncrByFloat: HINCRBYFLOAT,
  HKEYS,
  hKeys: HKEYS,
  HLEN,
  hLen: HLEN,
  HMGET,
  hmGet: HMGET,
  HRANDFIELD_COUNT_WITHVALUES,
  hRandFieldCountWithValues: HRANDFIELD_COUNT_WITHVALUES,
  HRANDFIELD_COUNT,
  hRandFieldCount: HRANDFIELD_COUNT,
  HRANDFIELD,
  hRandField: HRANDFIELD,
  HSCAN,
  hScan: HSCAN,
  HSET,
  hSet: HSET,
  HSETNX,
  hSetNX: HSETNX,
  HSTRLEN,
  hStrLen: HSTRLEN,
  HVALS,
  hVals: HVALS,
  INCR,
  incr: INCR,
  INCRBY,
  incrBy: INCRBY,
  INCRBYFLOAT,
  incrByFloat: INCRBYFLOAT,
  INFO,
  info: INFO,
  KEYS,
  keys: KEYS,
  LASTSAVE,
  lastSave: LASTSAVE,
  LCS_IDX_WITHMATCHLEN,
  lcsIdxWithMatchLen: LCS_IDX_WITHMATCHLEN,
  LCS_IDX,
  lcsIdx: LCS_IDX,
  LCS_LEN,
  lcsLen: LCS_LEN,
  LCS,
  lcs: LCS,
  LINDEX,
  lIndex: LINDEX,
  LINSERT,
  lInsert: LINSERT,
  LLEN,
  lLen: LLEN,
  LMOVE,
  lMove: LMOVE,
  LMPOP,
  lmPop: LMPOP,
  LOLWUT,
  LPOP_COUNT,
  lPopCount: LPOP_COUNT,
  LPOP,
  lPop: LPOP,
  LPOS_COUNT,
  lPosCount: LPOS_COUNT,
  LPOS,
  lPos: LPOS,
  LPUSH,
  lPush: LPUSH,
  LPUSHX,
  lPushX: LPUSHX,
  LRANGE,
  lRange: LRANGE,
  LREM,
  lRem: LREM,
  LSET,
  lSet: LSET,
  LTRIM,
  lTrim: LTRIM,
  MEMORY_DOCTOR,
  memoryDoctor: MEMORY_DOCTOR,
  'MEMORY_MALLOC-STATS': MEMORY_MALLOC_STATS,
  memoryMallocStats: MEMORY_MALLOC_STATS,
  MEMORY_PURGE,
  memoryPurge: MEMORY_PURGE,
  // MEMORY_STATS,
  // memoryStats: MEMORY_STATS,
  MEMORY_USAGE,
  memoryUsage: MEMORY_USAGE,
  MGET,
  mGet: MGET,
  MODULE_LIST,
  moduleList: MODULE_LIST,
  MODULE_LOAD,
  moduleLoad: MODULE_LOAD,
  MODULE_UNLOAD,
  moduleUnload: MODULE_UNLOAD,
  MOVE,
  move: MOVE,
  MSET,
  mSet: MSET,
  MSETNX,
  mSetNX: MSETNX,
  OBJECT_ENCODING,
  objectEncoding: OBJECT_ENCODING,
  OBJECT_FREQ,
  objectFreq: OBJECT_FREQ,
  OBJECT_IDLETIME,
  objectIdleTime: OBJECT_IDLETIME,
  OBJECT_REFCOUNT,
  objectRefCount: OBJECT_REFCOUNT,
  PERSIST,
  persist: PERSIST,
  PEXPIRE,
  pExpire: PEXPIRE,
  PEXPIREAT,
  pExpireAt: PEXPIREAT,
  PEXPIRETIME,
  pExpireTime: PEXPIRETIME,
  PFADD,
  pfAdd: PFADD,
  PFCOUNT,
  pfCount: PFCOUNT,
  PFMERGE,
  pfMerge: PFMERGE,
  PING,
  /**
   * ping jsdoc
   */
  ping: PING,
  PSETEX,
  pSetEx: PSETEX,
  PTTL,
  pTTL: PTTL,
  PUBLISH,
  publish: PUBLISH,
  PUBSUB_CHANNELS,
  pubSubChannels: PUBSUB_CHANNELS,
  PUBSUB_NUMPAT,
  pubSubNumPat: PUBSUB_NUMPAT,
  PUBSUB_NUMSUB,
  pubSubNumSub: PUBSUB_NUMSUB,
  PUBSUB_SHARDCHANNELS,
  pubSubShardChannels: PUBSUB_SHARDCHANNELS,
  RANDOMKEY,
  randomKey: RANDOMKEY,
  READONLY,
  readonly: READONLY,
  RENAME,
  rename: RENAME,
  RENAMENX,
  renameNX: RENAMENX,
  RPOP_COUNT,
  rPopCount: RPOP_COUNT,
  RPOP,
  rPop: RPOP,
  RPOPLPUSH,
  rPopLPush: RPOPLPUSH,
  RPUSH,
  rPush: RPUSH,
  RPUSHX,
  rPushX: RPUSHX,
  SADD,
  sAdd: SADD,
  SCAN,
  scan: SCAN,
  SCARD,
  sCard: SCARD,
  SCRIPT_DEBUG,
  scriptDebug: SCRIPT_DEBUG,
  SCRIPT_EXISTS,
  scriptExists: SCRIPT_EXISTS,
  SCRIPT_FLUSH,
  scriptFlush: SCRIPT_FLUSH,
  SCRIPT_KILL,
  scriptKill: SCRIPT_KILL,
  SCRIPT_LOAD,
  scriptLoad: SCRIPT_LOAD,
  SDIFF,
  sDiff: SDIFF,
  SDIFFSTORE,
  sDiffStore: SDIFFSTORE,
  SET,
  set: SET,
  SETBIT,
  setBit: SETBIT,
  SETEX,
  setEx: SETEX,
  SETNX,
  setNX: SETNX,
  SETRANGE,
  setRange: SETRANGE,
  SINTER,
  sInter: SINTER,
  SINTERCARD,
  sInterCard: SINTERCARD,
  SINTERSTORE,
  sInterStore: SINTERSTORE,
  SISMEMBER,
  sIsMember: SISMEMBER,
  SMEMBERS,
  sMembers: SMEMBERS,
  SMISMEMBER,
  smIsMember: SMISMEMBER,
  SMOVE,
  sMove: SMOVE,
  SORT_RO,
  sortRo: SORT_RO,
  SORT_STORE,
  sortStore: SORT_STORE,
  SORT,
  sort: SORT,
  SPOP_COUNT,
  sPopCount: SPOP_COUNT,
  SPOP,
  sPop: SPOP,
  SPUBLISH,
  sPublish: SPUBLISH,
  SRANDMEMBER_COUNT,
  sRandMemberCount: SRANDMEMBER_COUNT,
  SRANDMEMBER,
  sRandMember: SRANDMEMBER,
  SREM,
  sRem: SREM,
  SSCAN,
  sScan: SSCAN,
  STRLEN,
  strLen: STRLEN,
  SUNION,
  sUnion: SUNION,
  SUNIONSTORE,
  sUnionStore: SUNIONSTORE,
  TOUCH,
  touch: TOUCH,
  TTL,
  ttl: TTL,
  TYPE,
  type: TYPE,
  UNLINK,
  unlink: UNLINK,
  UNWATCH,
  unwatch: UNWATCH,
  WAIT,
  wait: WAIT,
  WATCH,
  watch: WATCH,
  XACK,
  xAck: XACK,
  XADD_NOMKSTREAM,
  xAddNoMkStream: XADD_NOMKSTREAM,
  XADD,
  xAdd: XADD,
  XDEL,
  xDel: XDEL,
  XSETID,
  xSetId: XSETID,
  XTRIM,
  xTrim: XTRIM,
  XLEN,
  xLen: XLEN,
  ZADD_INCR,
  zAddIncr: ZADD_INCR,
  ZADD,
  zAdd: ZADD,
  ZCARD,
  zCard: ZCARD,
  ZCOUNT,
  zCount: ZCOUNT,
  ZDIFF_WITHSCORES,
  zDiffWithScores: ZDIFF_WITHSCORES,
  ZDIFF,
  zDiff: ZDIFF,
  ZDIFFSTORE,
  zDiffStore: ZDIFFSTORE,
  ZINCRBY,
  zIncrBy: ZINCRBY,
  ZINTER_WITHSCORES,
  zInterWithScores: ZINTER_WITHSCORES,
  ZINTER,
  zInter: ZINTER,
  ZINTERCARD,
  zInterCard: ZINTERCARD,
  ZINTERSTORE,
  zInterStore: ZINTERSTORE,
  ZLEXCOUNT,
  zLexCount: ZLEXCOUNT,
  ZMSCORE,
  zmScore: ZMSCORE,
  ZRANDMEMBER_COUNT_WITHSCORES,
  zRandMemberCountWithScores: ZRANDMEMBER_COUNT_WITHSCORES,
  ZRANDMEMBER_COUNT,
  zRandMemberCount: ZRANDMEMBER_COUNT,
  ZRANDMEMBER,
  zRandMember: ZRANDMEMBER,
  ZRANGE,
  zRange: ZRANGE,
  ZRANGEBYLEX,
  zRangeByLex: ZRANGEBYLEX,
  ZRANGEBYSCORE_WITHSCORES,
  zRangeByScoreWithScores: ZRANGEBYSCORE_WITHSCORES,
  ZRANGEBYSCORE,
  zRangeByScore: ZRANGEBYSCORE,
  ZRANK,
  zRank: ZRANK,
  ZREM,
  zRem: ZREM,
  ZREMRANGEBYLEX,
  zRemRangeByLex: ZREMRANGEBYLEX,
  ZREMRANGEBYRANK,
  zRemRangeByRank: ZREMRANGEBYRANK,
  ZREMRANGEBYSCORE,
  zRemRangeByScore: ZREMRANGEBYSCORE,
  ZREVRANK,
  zRevRank: ZREVRANK,
  ZSCAN,
  zScan: ZSCAN,
  ZSCORE,
  zScore: ZSCORE,
  ZUNION_WITHSCORES,
  zUnionWithScores: ZUNION_WITHSCORES,
  ZUNION,
  zUnion: ZUNION,
  ZUNIONSTORE,
  zUnionStore: ZUNIONSTORE
} as const satisfies Record<string, Command> as Commands;
