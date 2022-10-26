
import * as APPEND from '../commands/APPEND';
import * as BITCOUNT from '../commands/BITCOUNT';
import * as BITFIELD_RO from '../commands/BITFIELD_RO';
import * as BITFIELD from '../commands/BITFIELD';
import * as BITOP from '../commands/BITOP';
import * as BITPOS from '../commands/BITPOS';
import * as BLMOVE from '../commands/BLMOVE';
import * as BLMPOP from '../commands/BLMPOP';
import * as BLPOP from '../commands/BLPOP';
import * as BRPOP from '../commands/BRPOP';
import * as BRPOPLPUSH from '../commands/BRPOPLPUSH';
import * as BZMPOP from '../commands/BZMPOP';
import * as BZPOPMAX from '../commands/BZPOPMAX';
import * as BZPOPMIN from '../commands/BZPOPMIN';
import * as COPY from '../commands/COPY';
import * as DECR from '../commands/DECR';
import * as DECRBY from '../commands/DECRBY';
import * as DEL from '../commands/DEL';
import * as DUMP from '../commands/DUMP';
import * as EVAL_RO from '../commands/EVAL_RO';
import * as EVAL from '../commands/EVAL';
import * as EVALSHA_RO from '../commands/EVALSHA_RO';
import * as EVALSHA from '../commands/EVALSHA';
import * as EXISTS from '../commands/EXISTS';
import * as EXPIRE from '../commands/EXPIRE';
import * as EXPIREAT from '../commands/EXPIREAT';
import * as EXPIRETIME from '../commands/EXPIRETIME';
import * as FCALL_RO from '../commands/FCALL_RO';
import * as FCALL from '../commands/FCALL';
import * as GEOADD from '../commands/GEOADD';
import * as GEODIST from '../commands/GEODIST';
import * as GEOHASH from '../commands/GEOHASH';
import * as GEOPOS from '../commands/GEOPOS';
import * as GEORADIUS_RO_WITH from '../commands/GEORADIUS_RO_WITH';
import * as GEORADIUS_RO from '../commands/GEORADIUS_RO';
import * as GEORADIUS_WITH from '../commands/GEORADIUS_WITH';
import * as GEORADIUS from '../commands/GEORADIUS';
import * as GEORADIUSBYMEMBER_RO_WITH from '../commands/GEORADIUSBYMEMBER_RO_WITH';
import * as GEORADIUSBYMEMBER_RO from '../commands/GEORADIUSBYMEMBER_RO';
import * as GEORADIUSBYMEMBER_WITH from '../commands/GEORADIUSBYMEMBER_WITH';
import * as GEORADIUSBYMEMBER from '../commands/GEORADIUSBYMEMBER';
import * as GEORADIUSBYMEMBERSTORE from '../commands/GEORADIUSBYMEMBERSTORE';
import * as GEORADIUSSTORE from '../commands/GEORADIUSSTORE';
import * as GEOSEARCH_WITH from '../commands/GEOSEARCH_WITH';
import * as GEOSEARCH from '../commands/GEOSEARCH';
import * as GEOSEARCHSTORE from '../commands/GEOSEARCHSTORE';
import * as GET from '../commands/GET';
import * as GETBIT from '../commands/GETBIT';
import * as GETDEL from '../commands/GETDEL';
import * as GETEX from '../commands/GETEX';
import * as GETRANGE from '../commands/GETRANGE';
import * as GETSET from '../commands/GETSET';
import * as HDEL from '../commands/HDEL';
import * as HEXISTS from '../commands/HEXISTS';
import * as HGET from '../commands/HGET';
import * as HGETALL from '../commands/HGETALL';
import * as HINCRBY from '../commands/HINCRBY';
import * as HINCRBYFLOAT from '../commands/HINCRBYFLOAT';
import * as HKEYS from '../commands/HKEYS';
import * as HLEN from '../commands/HLEN';
import * as HMGET from '../commands/HMGET';
import * as HRANDFIELD_COUNT_WITHVALUES from '../commands/HRANDFIELD_COUNT_WITHVALUES';
import * as HRANDFIELD_COUNT from '../commands/HRANDFIELD_COUNT';
import * as HRANDFIELD from '../commands/HRANDFIELD';
import * as HSCAN from '../commands/HSCAN';
import * as HSET from '../commands/HSET';
import * as HSETNX from '../commands/HSETNX';
import * as HSTRLEN from '../commands/HSTRLEN';
import * as HVALS from '../commands/HVALS';
import * as INCR from '../commands/INCR';
import * as INCRBY from '../commands/INCRBY';
import * as INCRBYFLOAT from '../commands/INCRBYFLOAT';
import * as LCS_IDX_WITHMATCHLEN from '../commands/LCS_IDX_WITHMATCHLEN';
import * as LCS_IDX from '../commands/LCS_IDX';
import * as LCS_LEN from '../commands/LCS_LEN';
import * as LCS from '../commands/LCS';
import * as LINDEX from '../commands/LINDEX';
import * as LINSERT from '../commands/LINSERT';
import * as LLEN from '../commands/LLEN';
import * as LMOVE from '../commands/LMOVE';
import * as LMPOP from '../commands/LMPOP';
import * as LPOP_COUNT from '../commands/LPOP_COUNT';
import * as LPOP from '../commands/LPOP';
import * as LPOS_COUNT from '../commands/LPOS_COUNT';
import * as LPOS from '../commands/LPOS';
import * as LPUSH from '../commands/LPUSH';
import * as LPUSHX from '../commands/LPUSHX';
import * as LRANGE from '../commands/LRANGE';
import * as LREM from '../commands/LREM';
import * as LSET from '../commands/LSET';
import * as LTRIM from '../commands/LTRIM';
import * as MGET from '../commands/MGET';
import * as MIGRATE from '../commands/MIGRATE';
import * as MSET from '../commands/MSET';
import * as MSETNX from '../commands/MSETNX';
import * as OBJECT_ENCODING from '../commands/OBJECT_ENCODING';
import * as OBJECT_FREQ from '../commands/OBJECT_FREQ';
import * as OBJECT_IDLETIME from '../commands/OBJECT_IDLETIME';
import * as OBJECT_REFCOUNT from '../commands/OBJECT_REFCOUNT';
import * as PERSIST from '../commands/PERSIST';
import * as PEXPIRE from '../commands/PEXPIRE';
import * as PEXPIREAT from '../commands/PEXPIREAT';
import * as PEXPIRETIME from '../commands/PEXPIRETIME';
import * as PFADD from '../commands/PFADD';
import * as PFCOUNT from '../commands/PFCOUNT';
import * as PFMERGE from '../commands/PFMERGE';
import * as PSETEX from '../commands/PSETEX';
import * as PTTL from '../commands/PTTL';
import * as PUBLISH from '../commands/PUBLISH';
import * as RENAME from '../commands/RENAME';
import * as RENAMENX from '../commands/RENAMENX';
import * as RPOP_COUNT from '../commands/RPOP_COUNT';
import * as RPOP from '../commands/RPOP';
import * as RPOPLPUSH from '../commands/RPOPLPUSH';
import * as RPUSH from '../commands/RPUSH';
import * as RPUSHX from '../commands/RPUSHX';
import * as SADD from '../commands/SADD';
import * as SCARD from '../commands/SCARD';
import * as SDIFF from '../commands/SDIFF';
import * as SDIFFSTORE from '../commands/SDIFFSTORE';
import * as SET from '../commands/SET';
import * as SETBIT from '../commands/SETBIT';
import * as SETEX from '../commands/SETEX';
import * as SETNX from '../commands/SETNX';
import * as SETRANGE from '../commands/SETRANGE';
import * as SINTER from '../commands/SINTER';
import * as SINTERCARD from '../commands/SINTERCARD';
import * as SINTERSTORE from '../commands/SINTERSTORE';
import * as SISMEMBER from '../commands/SISMEMBER';
import * as SMEMBERS from '../commands/SMEMBERS';
import * as SMISMEMBER from '../commands/SMISMEMBER';
import * as SMOVE from '../commands/SMOVE';
import * as SORT_RO from '../commands/SORT_RO';
import * as SORT_STORE from '../commands/SORT_STORE';
import * as SORT from '../commands/SORT';
import * as SPOP from '../commands/SPOP';
import * as SRANDMEMBER_COUNT from '../commands/SRANDMEMBER_COUNT';
import * as SRANDMEMBER from '../commands/SRANDMEMBER';
import * as SREM from '../commands/SREM';
import * as SSCAN from '../commands/SSCAN';
import * as STRLEN from '../commands/STRLEN';
import * as SUNION from '../commands/SUNION';
import * as SUNIONSTORE from '../commands/SUNIONSTORE';
import * as TOUCH from '../commands/TOUCH';
import * as TTL from '../commands/TTL';
import * as TYPE from '../commands/TYPE';
import * as UNLINK from '../commands/UNLINK';
import * as WATCH from '../commands/WATCH';
import * as XACK from '../commands/XACK';
import * as XADD from '../commands/XADD';
import * as XAUTOCLAIM_JUSTID from '../commands/XAUTOCLAIM_JUSTID';
import * as XAUTOCLAIM from '../commands/XAUTOCLAIM';
import * as XCLAIM_JUSTID from '../commands/XCLAIM_JUSTID';
import * as XCLAIM from '../commands/XCLAIM';
import * as XDEL from '../commands/XDEL';
import * as XGROUP_CREATE from '../commands/XGROUP_CREATE';
import * as XGROUP_CREATECONSUMER from '../commands/XGROUP_CREATECONSUMER';
import * as XGROUP_DELCONSUMER from '../commands/XGROUP_DELCONSUMER';
import * as XGROUP_DESTROY from '../commands/XGROUP_DESTROY';
import * as XGROUP_SETID from '../commands/XGROUP_SETID';
import * as XINFO_CONSUMERS from '../commands/XINFO_CONSUMERS';
import * as XINFO_GROUPS from '../commands/XINFO_GROUPS';
import * as XINFO_STREAM from '../commands/XINFO_STREAM';
import * as XLEN from '../commands/XLEN';
import * as XPENDING_RANGE from '../commands/XPENDING_RANGE';
import * as XPENDING from '../commands/XPENDING';
import * as XRANGE from '../commands/XRANGE';
import * as XREAD from '../commands/XREAD';
import * as XREADGROUP from '../commands/XREADGROUP';
import * as XREVRANGE from '../commands/XREVRANGE';
import * as XSETID from '../commands/XSETID';
import * as XTRIM from '../commands/XTRIM';
import * as ZADD from '../commands/ZADD';
import * as ZCARD from '../commands/ZCARD';
import * as ZCOUNT from '../commands/ZCOUNT';
import * as ZDIFF_WITHSCORES from '../commands/ZDIFF_WITHSCORES';
import * as ZDIFF from '../commands/ZDIFF';
import * as ZDIFFSTORE from '../commands/ZDIFFSTORE';
import * as ZINCRBY from '../commands/ZINCRBY';
import * as ZINTER_WITHSCORES from '../commands/ZINTER_WITHSCORES';
import * as ZINTER from '../commands/ZINTER';
import * as ZINTERCARD from '../commands/ZINTERCARD';
import * as ZINTERSTORE from '../commands/ZINTERSTORE';
import * as ZLEXCOUNT from '../commands/ZLEXCOUNT';
import * as ZMPOP from '../commands/ZMPOP';
import * as ZMSCORE from '../commands/ZMSCORE';
import * as ZPOPMAX_COUNT from '../commands/ZPOPMAX_COUNT';
import * as ZPOPMAX from '../commands/ZPOPMAX';
import * as ZPOPMIN_COUNT from '../commands/ZPOPMIN_COUNT';
import * as ZPOPMIN from '../commands/ZPOPMIN';
import * as ZRANDMEMBER_COUNT_WITHSCORES from '../commands/ZRANDMEMBER_COUNT_WITHSCORES';
import * as ZRANDMEMBER_COUNT from '../commands/ZRANDMEMBER_COUNT';
import * as ZRANDMEMBER from '../commands/ZRANDMEMBER';
import * as ZRANGE_WITHSCORES from '../commands/ZRANGE_WITHSCORES';
import * as ZRANGE from '../commands/ZRANGE';
import * as ZRANGEBYLEX from '../commands/ZRANGEBYLEX';
import * as ZRANGEBYSCORE_WITHSCORES from '../commands/ZRANGEBYSCORE_WITHSCORES';
import * as ZRANGEBYSCORE from '../commands/ZRANGEBYSCORE';
import * as ZRANGESTORE from '../commands/ZRANGESTORE';
import * as ZRANK from '../commands/ZRANK';
import * as ZREM from '../commands/ZREM';
import * as ZREMRANGEBYLEX from '../commands/ZREMRANGEBYLEX';
import * as ZREMRANGEBYRANK from '../commands/ZREMRANGEBYRANK';
import * as ZREMRANGEBYSCORE from '../commands/ZREMRANGEBYSCORE';
import * as ZREVRANGE from '../commands/ZREVRANGE';
import * as ZREVRANGEWITHSCORES from '../commands/ZREVRANGE_WITHSCORES';
import * as ZREVRANK from '../commands/ZREVRANK';
import * as ZSCAN from '../commands/ZSCAN';
import * as ZSCORE from '../commands/ZSCORE';
import * as ZUNION_WITHSCORES from '../commands/ZUNION_WITHSCORES';
import * as ZUNION from '../commands/ZUNION';
import * as ZUNIONSTORE from '../commands/ZUNIONSTORE';

export default {
    APPEND,
    append: APPEND,
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
    BZMPOP,
    bzmPop: BZMPOP,
    BZPOPMAX,
    bzPopMax: BZPOPMAX,
    BZPOPMIN,
    bzPopMin: BZPOPMIN,
    COPY,
    copy: COPY,
    DECR,
    decr: DECR,
    DECRBY,
    decrBy: DECRBY,
    DEL,
    del: DEL,
    DUMP,
    dump: DUMP,
    EVAL_RO,
    evalRo: EVAL_RO,
    EVAL,
    eval: EVAL,
    EVALSHA,
    evalSha: EVALSHA,
    EVALSHA_RO,
    evalShaRo: EVALSHA_RO,
    EXISTS,
    exists: EXISTS,
    EXPIRE,
    expire: EXPIRE,
    EXPIREAT,
    expireAt: EXPIREAT,
    EXPIRETIME,
    expireTime: EXPIRETIME,
    FCALL_RO,
    fCallRo: FCALL_RO,
    FCALL,
    fCall: FCALL,
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
    GEORADIUS_WITH,
    geoRadiusWith: GEORADIUS_WITH,
    GEORADIUS,
    geoRadius: GEORADIUS,
    GEORADIUSBYMEMBER_RO_WITH,
    geoRadiusByMemberRoWith: GEORADIUSBYMEMBER_RO_WITH,
    GEORADIUSBYMEMBER_RO,
    geoRadiusByMemberRo: GEORADIUSBYMEMBER_RO,
    GEORADIUSBYMEMBER_WITH,
    geoRadiusByMemberWith: GEORADIUSBYMEMBER_WITH,
    GEORADIUSBYMEMBER,
    geoRadiusByMember: GEORADIUSBYMEMBER,
    GEORADIUSBYMEMBERSTORE,
    geoRadiusByMemberStore: GEORADIUSBYMEMBERSTORE,
    GEORADIUSSTORE,
    geoRadiusStore: GEORADIUSSTORE,
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
    MIGRATE,
    migrate: MIGRATE,
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
    PSETEX,
    pSetEx: PSETEX,
    PTTL,
    pTTL: PTTL,
    PUBLISH,
    publish: PUBLISH,
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
    SCARD,
    sCard: SCARD,
    SDIFF,
    sDiff: SDIFF,
    SDIFFSTORE,
    sDiffStore: SDIFFSTORE,
    SINTER,
    sInter: SINTER,
    SINTERCARD,
    sInterCard: SINTERCARD,
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
    TOUCH,
    touch: TOUCH,
    TTL,
    ttl: TTL,
    TYPE,
    type: TYPE,
    UNLINK,
    unlink: UNLINK,
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
    XSETID,
    xSetId: XSETID,
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
    ZINTERCARD,
    zInterCard: ZINTERCARD,
    ZINTERSTORE,
    zInterStore: ZINTERSTORE,
    ZLEXCOUNT,
    zLexCount: ZLEXCOUNT,
    ZMPOP,
    zmPop: ZMPOP,
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
    ZRANGEBYLEX,
    zRangeByLex: ZRANGEBYLEX,
    ZRANGEBYSCORE_WITHSCORES,
    zRangeByScoreWithScores: ZRANGEBYSCORE_WITHSCORES,
    ZRANGEBYSCORE,
    zRangeByScore: ZRANGEBYSCORE,
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
    ZREVRANGE,
    zRevRange: ZREVRANGE,
    ZREVRANGEWITHSCORES,
    zRevRangeWithScores: ZREVRANGEWITHSCORES,
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
