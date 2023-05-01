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
import DECR from './DECR';
import DECRBY from './DECRBY';
import GET from './GET';
import GETDEL from './GETDEL';
import GETEX from './GETEX';
import GETRANGE from './GETRANGE';
import GETSET from './GETSET';
import FLUSHALL from './FLUSHALL';
import HDEL from './HDEL';
import HEXISTS from './HEXISTS';
import HGET from './HGET';
import HGETALL from './HGETALL';
import HINCRBY from './HINCRBY';
import HINCRBYFLOAT from './HINCRBYFLOAT';
import HKEYS from './HKEYS';
import HLEN from './HLEN'
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
// import LCS_IDX_WITHMATCHLEN from './LCS_IDX_WITHMATCHLEN';
// import LCS_IDX from './LCS_IDX';
import LCS_LEN from './LCS_LEN';
import LCS from './LCS';
import LINDEX from './LINDEX';
import LINSERT from './LINSERT';
import LLEN from './LLEN';
import LMOVE from './LMOVE';
import LMPOP from './LMPOP';
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
import MGET from './MGET';
import MSET from './MSET';
import MSETNX from './MSETNX';
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
import RANDOMKEY from './RANDOMKEY';
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
import SORT_RO from './SORT_RO';
import SORT_STORE from './SORT_STORE';
import SORT from './SORT';
import SPUBLISH from './SPUBLISH';
import SRANDMEMBER_COUNT from './SRANDMEMBER_COUNT';
import SRANDMEMBER from './SRANDMEMBER';
import SREM from './SREM';
import SSCAN from './SSCAN';
import STRLEN from './STRLEN';
import TOUCH from './TOUCH';
import TTL from './TTL';
import TYPE from './TYPE';
import UNLINK from './UNLINK';
import UNWATCH from './UNWATCH';
import WAIT from './WAIT';
import WATCH from './WATCH';
import XLEN from './XLEN';
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
import ZRANK from './ZRANK';
import ZREM from './ZREM';
import ZREVRANK from './ZREVRANK';
import ZSCAN from './ZSCAN';
import ZSCORE from './ZSCORE';
import { Command } from '../RESP/types';

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
  DECR,
  decr: DECR,
  DECRBY,
  decrBy: DECRBY,
  GET,
  get: GET,
  GETDEL,
  getDel: GETDEL,
  GETEX,
  getEx: GETEX,
  GETRANGE,
  getRange: GETRANGE,
  GETSET,
  getSet: GETSET,
  FLUSHALL,
  flushAll: FLUSHALL,
  HDEL,
  hDel: HDEL,
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
  hMGet: HMGET,
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
  hSetNx: HSETNX,
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
  // LCS_IDX_WITHMATCHLEN,
  // LCS_IDX,
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
  MGET,
  mGet: MGET,
  MSET,
  mSet: MSET,
  MSETNX,
  mSetNX: MSETNX,
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
  RANDOMKEY,
  randomKey: RANDOMKEY,
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
  SORT_RO,
  sortRo: SORT_RO,
  SORT_STORE,
  sortStore: SORT_STORE,
  SORT,
  sort: SORT,
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
  XLEN,
  xLen: XLEN,
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
  ZRANK,
  zRank: ZRANK,
  ZREM,
  zRem: ZREM,
  ZREVRANK,
  zRevRank: ZREVRANK,
  ZSCAN,
  zScan: ZSCAN,
  ZSCORE,
  zScore: ZSCORE
} as const satisfies Record<string, Command>;
