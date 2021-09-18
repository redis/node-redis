import * as ACL_CAT from './ACL_CAT';
import * as ACL_DELUSER from './ACL_DELUSER';
import * as ACL_GENPASS from './ACL_GENPASS';
import * as ACL_GETUSER from './ACL_GETUSER';
import * as ACL_LIST from './ACL_LIST';
import * as ACL_LOAD from './ACL_LOAD';
import * as ACL_LOG_RESET from './ACL_LOG_RESET';
import * as ACL_LOG from './ACL_LOG';
import * as ACL_SAVE from './ACL_SAVE';
import * as ACL_SETUSER from './ACL_SETUSER';
import * as ACL_USERS from './ACL_USERS';
import * as ACL_WHOAMI from './ACL_WHOAMI';
import * as APPEND from './APPEND';
import * as ASKING from './ASKING';
import * as AUTH from './AUTH';
import * as BGREWRITEAOF from './BGREWRITEAOF';
import * as BGSAVE from './BGSAVE';
import * as BITCOUNT from './BITCOUNT';
import * as BITFIELD from './BITFIELD';
import * as BITOP from './BITOP';
import * as BITPOS from './BITPOS';
import * as BLMOVE from './BLMOVE';
import * as BLPOP from './BLPOP';
import * as BRPOP from './BRPOP';
import * as BRPOPLPUSH from './BRPOPLPUSH';
import * as BZPOPMAX from './BZPOPMAX';
import * as BZPOPMIN from './BZPOPMIN';
import * as CLIENT_ID from './CLIENT_ID';
import * as CLIENT_INFO from './CLIENT_INFO';
import * as CLUSTER_ADDSLOTS from './CLUSTER_ADDSLOTS';
import * as CLUSTER_FLUSHSLOTS from './CLUSTER_FLUSHSLOTS';
import * as CLUSTER_INFO from './CLUSTER_INFO';
import * as CLUSTER_NODES from './CLUSTER_NODES';
import * as CLUSTER_MEET from './CLUSTER_MEET';
import * as CLUSTER_RESET from './CLUSTER_RESET';
import * as CLUSTER_SETSLOT from './CLUSTER_SETSLOT';
import * as CONFIG_GET from './CONFIG_GET';
import * as CONFIG_RESETASTAT from './CONFIG_RESETSTAT';
import * as CONFIG_REWRITE from './CONFIG_REWRITE';
import * as CONFIG_SET from './CONFIG_SET';
import * as COPY from './COPY';
import * as DBSIZE from './DBSIZE';
import * as DECR from './DECR';
import * as DECRBY from './DECRBY';
import * as DEL from './DEL';
import * as DISCARD from './DISCARD';
import * as DUMP from './DUMP';
import * as ECHO from './ECHO';
import * as EVAL from './EVAL';
import * as EVALSHA from './EVALSHA';
import * as EXISTS from './EXISTS';
import * as EXPIRE from './EXPIRE';
import * as EXPIREAT from './EXPIREAT';
import * as FAILOVER from './FAILOVER';
import * as FLUSHALL from './FLUSHALL';
import * as FLUSHDB from './FLUSHDB';
import * as GEOADD from './GEOADD';
import * as GEODIST from './GEODIST';
import * as GEOHASH from './GEOHASH';
import * as GEOPOS from './GEOPOS';
import * as GEOSEARCH_WITH from './GEOSEARCH_WITH';
import * as GEOSEARCH from './GEOSEARCH';
import * as GEOSEARCHSTORE from './GEOSEARCHSTORE';
import * as GET_BUFFER from './GET_BUFFER';
import * as GET from './GET';
import * as GETBIT from './GETBIT';
import * as GETDEL from './GETDEL';
import * as GETEX from './GETEX';
import * as GETRANGE from './GETRANGE';
import * as GETSET from './GETSET';
import * as HDEL from './HDEL';
import * as HELLO from './HELLO';
import * as HEXISTS from './HEXISTS';
import * as HGET from './HGET';
import * as HGETALL from './HGETALL';
import * as HINCRBY from './HINCRBY';
import * as HINCRBYFLOAT from './HINCRBYFLOAT';
import * as HKEYS from './HKEYS';
import * as HLEN from './HLEN';
import * as HMGET from './HMGET';
import * as HRANDFIELD_COUNT_WITHVALUES from './HRANDFIELD_COUNT_WITHVALUES';
import * as HRANDFIELD_COUNT from './HRANDFIELD_COUNT';
import * as HRANDFIELD from './HRANDFIELD';
import * as HSCAN from './HSCAN';
import * as HSET from './HSET';
import * as HSETNX from './HSETNX';
import * as HSTRLEN from './HSTRLEN';
import * as HVALS from './HVALS';
import * as INCR from './INCR';
import * as INCRBY from './INCRBY';
import * as INCRBYFLOAT from './INCRBYFLOAT';
import * as INFO from './INFO';
import * as KEYS from './KEYS';
import * as LASTSAVE from './LASTSAVE';
import * as LINDEX from './LINDEX';
import * as LINSERT from './LINSERT';
import * as LLEN from './LLEN';
import * as LMOVE from './LMOVE';
import * as LOLWUT from './LOLWUT';
import * as LPOP_COUNT from './LPOP_COUNT';
import * as LPOP from './LPOP';
import * as LPOS_COUNT from './LPOS_COUNT';
import * as LPOS from './LPOS';
import * as LPUSH from './LPUSH';
import * as LPUSHX from './LPUSHX';
import * as LRANGE from './LRANGE';
import * as LREM from './LREM';
import * as LSET from './LSET';
import * as LTRIM from './LTRIM';
import * as MEMOERY_DOCTOR from './MEMORY_DOCTOR';
import * as MEMORY_MALLOC_STATS from './MEMORY_MALLOC-STATS';
import * as MEMORY_PURGE from './MEMORY_PURGE';
import * as MEMORY_STATS from './MEMORY_STATS';
import * as MEMORY_USAGE from './MEMORY_USAGE';
import * as MGET from './MGET';
import * as MIGRATE from './MIGRATE';
import * as MODULE_LIST from './MODULE_LIST';
import * as MODULE_LOAD from './MODULE_LOAD';
import * as MODULE_UNLOAD from './MODULE_UNLOAD';
import * as MOVE from './MOVE';
import * as MSET from './MSET';
import * as MSETNX from './MSETNX';
import * as PERSIST from './PERSIST';
import * as PEXPIRE from './PEXPIRE';
import * as PEXPIREAT from './PEXPIREAT';
import * as PFADD from './PFADD';
import * as PFCOUNT from './PFCOUNT';
import * as PFMERGE from './PFMERGE';
import * as PING from './PING';
import * as PSETEX from './PSETEX';
import * as PTTL from './PTTL';
import * as PUBLISH from './PUBLISH';
import * as PUBSUB_CHANNELS from './PUBSUB_CHANNELS';
import * as PUBSUB_NUMPAT from './PUBSUB_NUMPAT';
import * as PUBSUB_NUMSUB from './PUBSUB_NUMSUB';
import * as RANDOMKEY from './RANDOMKEY';
import * as READONLY from './READONLY';
import * as READWRITE from './READWRITE';
import * as RENAME from './RENAME';
import * as RENAMENX from './RENAMENX';
import * as REPLICAOF from './REPLICAOF';
import * as RESTORE_ASKING from './RESTORE-ASKING';
import * as ROLE from './ROLE';
import * as RPOP_COUNT from './RPOP_COUNT';
import * as RPOP from './RPOP';
import * as RPOPLPUSH from './RPOPLPUSH';
import * as RPUSH from './RPUSH';
import * as RPUSHX from './RPUSHX';
import * as SADD from './SADD';
import * as SAVE from './SAVE';
import * as SCAN from './SCAN';
import * as SCARD from './SCARD';
import * as SCRIPT_DEBUG from './SCRIPT_DEBUG';
import * as SCRIPT_EXISTS from './SCRIPT_EXISTS';
import * as SCRIPT_FLUSH from './SCRIPT_FLUSH';
import * as SCRIPT_KILL from './SCRIPT_KILL';
import * as SCRIPT_LOAD from './SCRIPT_LOAD';
import * as SDIFF from './SDIFF';
import * as SDIFFSTORE from './SDIFFSTORE';
import * as SET from './SET';
import * as SETBIT from './SETBIT';
import * as SETEX from './SETEX';
import * as SETNX from './SETNX';
import * as SETRANGE from './SETRANGE';
import * as SHUTDOWN from './SHUTDOWN';
import * as SINTER from './SINTER';
import * as SINTERSTORE from './SINTERSTORE';
import * as SISMEMBER from './SISMEMBER';
import * as SMEMBERS from './SMEMBERS';
import * as SMISMEMBER from './SMISMEMBER';
import * as SMOVE from './SMOVE';
import * as SORT from './SORT';
import * as SPOP from './SPOP';
import * as SRANDMEMBER_COUNT from './SRANDMEMBER_COUNT';
import * as SRANDMEMBER from './SRANDMEMBER';
import * as SREM from './SREM';
import * as SSCAN from './SSCAN';
import * as STRLEN from './STRLEN';
import * as SUNION from './SUNION';
import * as SUNIONSTORE from './SUNIONSTORE';
import * as SWAPDB from './SWAPDB';
import * as TIME from './TIME';
import * as TOUCH from './TOUCH';
import * as TTL from './TTL';
import * as TYPE from './TYPE';
import * as UNLINK from './UNLINK';
import * as UNWATCH from './UNWATCH';
import * as WAIT from './WAIT';
import * as WATCH from './WATCH';
import * as XACK from './XACK';
import * as XADD from './XADD';
import * as XAUTOCLAIM_JUSTID from './XAUTOCLAIM_JUSTID';
import * as XAUTOCLAIM from './XAUTOCLAIM';
import * as XCLAIM from './XCLAIM';
import * as XCLAIM_JUSTID from './XCLAIM_JUSTID';
import * as XDEL from './XDEL';
import * as XGROUP_CREATE from './XGROUP_CREATE';
import * as XGROUP_CREATECONSUMER from './XGROUP_CREATECONSUMER';
import * as XGROUP_DELCONSUMER from './XGROUP_DELCONSUMER';
import * as XGROUP_DESTROY from './XGROUP_DESTROY';
import * as XGROUP_SETID from './XGROUP_SETID';
import * as XINFO_CONSUMERS from './XINFO_CONSUMERS';
import * as XINFO_GROUPS from './XINFO_GROUPS';
import * as XINFO_STREAM from './XINFO_STREAM';
import * as XLEN from './XLEN';
import * as XPENDING_RANGE from './XPENDING_RANGE';
import * as XPENDING from './XPENDING';
import * as XRANGE from './XRANGE';
import * as XREAD from './XREAD';
import * as XREADGROUP from './XREADGROUP';
import * as XREVRANGE from './XREVRANGE';
import * as XTRIM from './XTRIM';
import * as ZADD from './ZADD';
import * as ZCARD from './ZCARD';
import * as ZCOUNT from './ZCOUNT';
import * as ZDIFF_WITHSCORES from './ZDIFF_WITHSCORES';
import * as ZDIFF from './ZDIFF';
import * as ZDIFFSTORE from './ZDIFFSTORE';
import * as ZINCRBY from './ZINCRBY';
import * as ZINTER_WITHSCORES from './ZINTER_WITHSCORES';
import * as ZINTER from './ZINTER';
import * as ZINTERSTORE from './ZINTERSTORE';
import * as ZLEXCOUNT from './ZLEXCOUNT';
import * as ZMSCORE from './ZMSCORE';
import * as ZPOPMAX_COUNT from './ZPOPMAX_COUNT';
import * as ZPOPMAX from './ZPOPMAX';
import * as ZPOPMIN_COUNT from './ZPOPMIN_COUNT';
import * as ZPOPMIN from './ZPOPMIN';
import * as ZRANDMEMBER_COUNT_WITHSCORES from './ZRANDMEMBER_COUNT_WITHSCORES';
import * as ZRANDMEMBER_COUNT from './ZRANDMEMBER_COUNT';
import * as ZRANDMEMBER from './ZRANDMEMBER';
import * as ZRANGE_WITHSCORES from './ZRANGE_WITHSCORES';
import * as ZRANGE from './ZRANGE';
import * as ZRANGESTORE from './ZRANGESTORE';
import * as ZRANK from './ZRANK';
import * as ZREM from './ZREM';
import * as ZREMRANGEBYLEX from './ZREMRANGEBYLEX';
import * as ZREMRANGEBYRANK from './ZREMRANGEBYRANK';
import * as ZREMRANGEBYSCORE from './ZREMRANGEBYSCORE';
import * as ZREVRANK from './ZREVRANK';
import * as ZSCAN from './ZSCAN';
import * as ZSCORE from './ZSCORE';
import * as ZUNION_WITHSCORES from './ZUNION_WITHSCORES';
import * as ZUNION from './ZUNION';
import * as ZUNIONSTORE from './ZUNIONSTORE';

export default {
    ACL_CAT,
    aclCat: ACL_CAT,
    ACL_DELUSER,
    aclDelUser: ACL_DELUSER,
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
    BITFIELD,
    bitField: BITFIELD,
    BITOP,
    bitOp: BITOP,
    BITPOS,
    bitPos: BITPOS,
    BLMOVE,
    blMove: BLMOVE,
    BLPOP,
    blPop: BLPOP,
    BRPOP,
    brPop: BRPOP,
    BRPOPLPUSH,
    brPopLPush: BRPOPLPUSH,
    BZPOPMAX,
    bzPopMax: BZPOPMAX,
    BZPOPMIN,
    bzPopMin: BZPOPMIN,
    CLIENT_ID,
    clientId: CLIENT_ID,
    CLIENT_INFO,
    clientInfo: CLIENT_INFO,
    CLUSTER_ADDSLOTS,
    clusterAddSlots: CLUSTER_ADDSLOTS,
    CLUSTER_FLUSHSLOTS,
    clusterFlushSlots: CLUSTER_FLUSHSLOTS,
    CLUSTER_INFO,
    clusterInfo: CLUSTER_INFO,
    CLUSTER_NODES,
    clusterNodes: CLUSTER_NODES,
    CLUSTER_MEET,
    clusterMeet: CLUSTER_MEET,
    CLUSTER_RESET,
    clusterReset: CLUSTER_RESET,
    CLUSTER_SETSLOT,
    clusterSetSlot: CLUSTER_SETSLOT,
    CONFIG_GET,
    configGet: CONFIG_GET,
    CONFIG_RESETASTAT,
    configResetStat: CONFIG_RESETASTAT,
    CONFIG_REWRITE,
    configRewrite: CONFIG_REWRITE,
    CONFIG_SET,
    configSet: CONFIG_SET,
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
    DISCARD,
    discard: DISCARD,
    DUMP,
    dump: DUMP,
    ECHO,
    echo: ECHO,
    EVAL,
    eval: EVAL,
    EVALSHA,
    evalSha: EVALSHA,
    EXISTS,
    exists: EXISTS,
    EXPIRE,
    expire: EXPIRE,
    EXPIREAT,
    expireAt: EXPIREAT,
    FAILOVER,
    failover: FAILOVER,
    FLUSHALL,
    flushAll: FLUSHALL,
    FLUSHDB,
    flushDb: FLUSHDB,
    GEOADD,
    geoAdd: GEOADD,
    GEODIST,
    geoDist: GEODIST,
    GEOHASH,
    geoHash: GEOHASH,
    GEOPOS,
    geoPos: GEOPOS,
    GEOSEARCH_WITH,
    geoSearchWith: GEOSEARCH_WITH,
    GEOSEARCH,
    geoSearch: GEOSEARCH,
    GEOSEARCHSTORE,
    geoSearchStore: GEOSEARCHSTORE,
    GET_BUFFER,
    getBuffer: GET_BUFFER,
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
    LINDEX,
    lIndex: LINDEX,
    LINSERT,
    lInsert: LINSERT,
    LLEN,
    lLen: LLEN,
    LMOVE,
    lMove: LMOVE,
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
    MEMOERY_DOCTOR,
    memoryDoctor: MEMOERY_DOCTOR,
    'MEMORY_MALLOC-STATS': MEMORY_MALLOC_STATS,
    memoryMallocStats: MEMORY_MALLOC_STATS,
    MEMORY_PURGE,
    memoryPurge: MEMORY_PURGE,
    MEMORY_STATS,
    memoryStats: MEMORY_STATS,
    MEMORY_USAGE,
    memoryUsage: MEMORY_USAGE,
    MGET,
    mGet: MGET,
    MIGRATE,
    migrate: MIGRATE,
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
    PERSIST,
    persist: PERSIST,
    PEXPIRE,
    pExpire: PEXPIRE,
    PEXPIREAT,
    pExpireAt: PEXPIREAT,
    PFADD,
    pfAdd: PFADD,
    PFCOUNT,
    pfCount: PFCOUNT,
    PFMERGE,
    pfMerge: PFMERGE,
    PING,
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
    RANDOMKEY,
    randomKey: RANDOMKEY,
    READONLY,
    readonly: READONLY,
    READWRITE,
    readwrite: READWRITE,
    RENAME,
    rename: RENAME,
    RENAMENX,
    renameNX: RENAMENX,
    REPLICAOF,
    replicaOf: REPLICAOF,
    'RESTORE-ASKING': RESTORE_ASKING,
    restoreAsking: RESTORE_ASKING,
    ROLE,
    role: ROLE,
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
    SAVE,
    save: SAVE,
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
    SINTER,
    sInter: SINTER,
    SINTERSTORE,
    sInterStore: SINTERSTORE,
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
    SHUTDOWN,
    shutdown: SHUTDOWN,
    SISMEMBER,
    sIsMember: SISMEMBER,
    SMEMBERS,
    sMembers: SMEMBERS,
    SMISMEMBER,
    smIsMember: SMISMEMBER,
    SMOVE,
    sMove: SMOVE,
    SORT,
    sort: SORT,
    SPOP,
    sPop: SPOP,
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
    SWAPDB,
    swapDb: SWAPDB,
    TIME,
    time: TIME,
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
    XADD,
    xAdd: XADD,
    XAUTOCLAIM_JUSTID,
    xAutoClaimJustId: XAUTOCLAIM_JUSTID,
    XAUTOCLAIM,
    xAutoClaim: XAUTOCLAIM,
    XCLAIM,
    xClaim: XCLAIM,
    XCLAIM_JUSTID,
    xClaimJustId: XCLAIM_JUSTID,
    XDEL,
    xDel: XDEL,
    XGROUP_CREATE,
    xGroupCreate: XGROUP_CREATE,
    XGROUP_CREATECONSUMER,
    xGroupCreateConsumer: XGROUP_CREATECONSUMER,
    XGROUP_DELCONSUMER,
    xGroupDelConsumer: XGROUP_DELCONSUMER,
    XGROUP_DESTROY,
    xGroupDestroy: XGROUP_DESTROY,
    XGROUP_SETID,
    xGroupSetId: XGROUP_SETID,
    XINFO_CONSUMERS,
    xInfoConsumers: XINFO_CONSUMERS,
    XINFO_GROUPS,
    xInfoGroups: XINFO_GROUPS,
    XINFO_STREAM,
    xInfoStream: XINFO_STREAM,
    XLEN,
    xLen: XLEN,
    XPENDING_RANGE,
    xPendingRange: XPENDING_RANGE,
    XPENDING,
    xPending: XPENDING,
    XRANGE,
    xRange: XRANGE,
    XREAD,
    xRead: XREAD,
    XREADGROUP,
    xReadGroup: XREADGROUP,
    XREVRANGE,
    xRevRange: XREVRANGE,
    XTRIM,
    xTrim: XTRIM,
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
    ZINTERSTORE,
    zInterStore: ZINTERSTORE,
    ZLEXCOUNT,
    zLexCount: ZLEXCOUNT,
    ZMSCORE,
    zmScore: ZMSCORE,
    ZPOPMAX_COUNT,
    zPopMaxCount: ZPOPMAX_COUNT,
    ZPOPMAX,
    zPopMax: ZPOPMAX,
    ZPOPMIN_COUNT,
    zPopMinCount: ZPOPMIN_COUNT,
    ZPOPMIN,
    zPopMin: ZPOPMIN,
    ZRANDMEMBER_COUNT_WITHSCORES,
    zRandMemberCountWithScores: ZRANDMEMBER_COUNT_WITHSCORES,
    ZRANDMEMBER_COUNT,
    zRandMemberCount: ZRANDMEMBER_COUNT,
    ZRANDMEMBER,
    zRandMember: ZRANDMEMBER,
    ZRANGE_WITHSCORES,
    zRangeWithScores: ZRANGE_WITHSCORES,
    ZRANGE,
    zRange: ZRANGE,
    ZRANGESTORE,
    zRangeStore: ZRANGESTORE,
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
};

export type RedisReply = string | number | Buffer | Array<RedisReply> | null | undefined;

export type TransformArgumentsReply = Array<string | Buffer> & { preserve?: unknown };

export interface RedisCommand {
    FIRST_KEY_INDEX?: number | ((...args: Array<any>) => string);
    IS_READ_ONLY?: boolean;
    transformArguments(this: void, zpte...args: Array<any>): TransformArgumentsReply;
    BUFFER_MODE?: boolean;
    transformReply(this: void, reply: RedisReply, preserved?: unknown): any;
}

export interface RedisCommands {
    [command: string]: RedisCommand;
}

export interface RedisModule {
    [command: string]: RedisCommand;
}

export interface RedisModules {
    [module: string]: RedisModule;
}
// export type RedisModules = Record<string, RedisModule>;
