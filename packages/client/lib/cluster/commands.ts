
import * as APPEND from '../commands/APPEND';
import * as BITCOUNT from '../commands/BITCOUNT';
import * as BITFIELD from '../commands/BITFIELD';
import * as BITOP from '../commands/BITOP';
import * as BITPOS from '../commands/BITPOS';
import * as BLMOVE from '../commands/BLMOVE';
import * as BLPOP from '../commands/BLPOP';
import * as BRPOP from '../commands/BRPOP';
import * as BRPOPLPUSH from '../commands/BRPOPLPUSH';
import * as BZPOPMAX from '../commands/BZPOPMAX';
import * as BZPOPMIN from '../commands/BZPOPMIN';
import * as COPY from '../commands/COPY';
import * as DECR from '../commands/DECR';
import * as DECRBY from '../commands/DECRBY';
import * as DEL from '../commands/DEL';
import * as DUMP from '../commands/DUMP';
import * as EVAL from '../commands/EVAL';
import * as EVALSHA from '../commands/EVALSHA';
import * as EXISTS from '../commands/EXISTS';
import * as EXPIRE from '../commands/EXPIRE';
import * as EXPIREAT from '../commands/EXPIREAT';
import * as GEOADD from '../commands/GEOADD';
import * as GEODIST from '../commands/GEODIST';
import * as GEOHASH from '../commands/GEOHASH';
import * as GEOPOS from '../commands/GEOPOS';
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
import * as LINDEX from '../commands/LINDEX';
import * as LINSERT from '../commands/LINSERT';
import * as LLEN from '../commands/LLEN';
import * as LMOVE from '../commands/LMOVE';
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
import * as PERSIST from '../commands/PERSIST';
import * as PEXPIRE from '../commands/PEXPIRE';
import * as PEXPIREAT from '../commands/PEXPIREAT';
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
import * as SINTERSTORE from '../commands/SINTERSTORE';
import * as SISMEMBER from '../commands/SISMEMBER';
import * as SMEMBERS from '../commands/SMEMBERS';
import * as SMISMEMBER from '../commands/SMISMEMBER';
import * as SMOVE from '../commands/SMOVE';
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
import * as ZINTERSTORE from '../commands/ZINTERSTORE';
import * as ZLEXCOUNT from '../commands/ZLEXCOUNT';
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
    bitcount: BITCOUNT,
    BITFIELD,
    bitField: BITFIELD,
    bitfield: BITFIELD,
    BITOP,
    bitOp: BITOP,
    bitop: BITOP,
    BITPOS,
    bitPos: BITPOS,
    bitpos: BITPOS,
    BLMOVE,
    blMove: BLMOVE,
    blmove: BLMOVE,
    BLPOP,
    blPop: BLPOP,
    blpop: BLPOP,
    BRPOP,
    brPop: BRPOP,
    brpop: BRPOP,
    BRPOPLPUSH,
    brPopLPush: BRPOPLPUSH,
    brpoplpush: BRPOPLPUSH,
    BZPOPMAX,
    bzPopMax: BZPOPMAX,
    bzpopmax: BZPOPMAX,
    BZPOPMIN,
    bzPopMin: BZPOPMIN,
    bzpopmin: BZPOPMIN,
    COPY,
    copy: COPY,
    DECR,
    decr: DECR,
    DECRBY,
    decrBy: DECRBY,
    decrby: DECRBY,
    DEL,
    del: DEL,
    DUMP,
    dump: DUMP,
    EVAL,
    eval: EVAL,
    EVALSHA,
    evalSha: EVALSHA,
    evalsha: EVALSHA,
    EXISTS,
    exists: EXISTS,
    EXPIRE,
    expire: EXPIRE,
    EXPIREAT,
    expireAt: EXPIREAT,
    expireat: EXPIREAT,
    GEOADD,
    geoAdd: GEOADD,
    geoadd: GEOADD,
    GEODIST,
    geoDist: GEODIST,
    geodist: GEODIST,
    GEOHASH,
    geoHash: GEOHASH,
    geohash: GEOHASH,
    GEOPOS,
    geoPos: GEOPOS,
    geopos: GEOPOS,
    GEOSEARCH_WITH,
    geoSearchWith: GEOSEARCH_WITH,
    geosearch_with: GEOSEARCH_WITH,
    GEOSEARCH,
    geoSearch: GEOSEARCH,
    geosearch: GEOSEARCH,
    GEOSEARCHSTORE,
    geoSearchStore: GEOSEARCHSTORE,
    geosearchstore: GEOSEARCHSTORE,
    GET,
    get: GET,
    GETBIT,
    getBit: GETBIT,
    getbit: GETBIT,
    GETDEL,
    getDel: GETDEL,
    getdel: GETDEL,
    GETEX,
    getEx: GETEX,
    getex: GETEX,
    GETRANGE,
    getRange: GETRANGE,
    getrange: GETRANGE,
    GETSET,
    getSet: GETSET,
    getset: GETSET,
    HDEL,
    hDel: HDEL,
    hdel: HDEL,
    HEXISTS,
    hExists: HEXISTS,
    hexists: HEXISTS,
    HGET,
    hGet: HGET,
    hget: HGET,
    HGETALL,
    hGetAll: HGETALL,
    hgetall: HGETALL,
    HINCRBY,
    hIncrBy: HINCRBY,
    hincrby: HINCRBY,
    HINCRBYFLOAT,
    hIncrByFloat: HINCRBYFLOAT,
    hincrbyfloat: HINCRBYFLOAT,
    HKEYS,
    hKeys: HKEYS,
    hkeys: HKEYS,
    HLEN,
    hLen: HLEN,
    hlen: HLEN,
    HMGET,
    hmGet: HMGET,
    hmget: HMGET,
    HRANDFIELD_COUNT_WITHVALUES,
    hRandFieldCountWithValues: HRANDFIELD_COUNT_WITHVALUES,
    hrandfield_count_withvalues: HRANDFIELD_COUNT_WITHVALUES,
    HRANDFIELD_COUNT,
    hRandFieldCount: HRANDFIELD_COUNT,
    hrandfield_count: HRANDFIELD_COUNT,
    HRANDFIELD,
    hRandField: HRANDFIELD,
    hrandfield: HRANDFIELD,
    HSCAN,
    hScan: HSCAN,
    hscan: HSCAN,
    HSET,
    hSet: HSET,
    hset: HSET,
    HSETNX,
    hSetNX: HSETNX,
    hsetnx: HSETNX,
    HSTRLEN,
    hStrLen: HSTRLEN,
    hstrlen: HSTRLEN,
    HVALS,
    hVals: HVALS,
    hvals: HVALS,
    INCR,
    incr: INCR,
    INCRBY,
    incrBy: INCRBY,
    incrby: INCRBY,
    INCRBYFLOAT,
    incrByFloat: INCRBYFLOAT,
    incrbyfloat: INCRBYFLOAT,
    LINDEX,
    lIndex: LINDEX,
    lindex: LINDEX,
    LINSERT,
    lInsert: LINSERT,
    linsert: LINSERT,
    LLEN,
    lLen: LLEN,
    llen: LLEN,
    LMOVE,
    lMove: LMOVE,
    lmove: LMOVE,
    LPOP_COUNT,
    lPopCount: LPOP_COUNT,
    lpop_count: LPOP_COUNT,
    LPOP,
    lPop: LPOP,
    lpop: LPOP,
    LPOS_COUNT,
    lPosCount: LPOS_COUNT,
    lpos_count: LPOS_COUNT,
    LPOS,
    lPos: LPOS,
    lpos: LPOS,
    LPUSH,
    lPush: LPUSH,
    lpush: LPUSH,
    LPUSHX,
    lPushX: LPUSHX,
    lpushx: LPUSHX,
    LRANGE,
    lRange: LRANGE,
    lrange: LRANGE,
    LREM,
    lRem: LREM,
    lrem: LREM,
    LSET,
    lSet: LSET,
    lset: LSET,
    LTRIM,
    lTrim: LTRIM,
    ltrim: LTRIM,
    MGET,
    mGet: MGET,
    mget: MGET,
    MIGRATE,
    migrate: MIGRATE,
    MSET,
    mSet: MSET,
    mset: MSET,
    MSETNX,
    mSetNX: MSETNX,
    msetnx: MSETNX,
    PERSIST,
    persist: PERSIST,
    PEXPIRE,
    pExpire: PEXPIRE,
    pexpire: PEXPIRE,
    PEXPIREAT,
    pExpireAt: PEXPIREAT,
    pexpireat: PEXPIREAT,
    PFADD,
    pfAdd: PFADD,
    pfadd: PFADD,
    PFCOUNT,
    pfCount: PFCOUNT,
    pfcount: PFCOUNT,
    PFMERGE,
    pfMerge: PFMERGE,
    pfmerge: PFMERGE,
    PSETEX,
    pSetEx: PSETEX,
    psetex: PSETEX,
    PTTL,
    pTTL: PTTL,
    pttl: PTTL,
    PUBLISH,
    publish: PUBLISH,
    RENAME,
    rename: RENAME,
    RENAMENX,
    renameNX: RENAMENX,
    renamenx: RENAMENX,
    RPOP_COUNT,
    rPopCount: RPOP_COUNT,
    rpop_count: RPOP_COUNT,
    RPOP,
    rPop: RPOP,
    rpop: RPOP,
    RPOPLPUSH,
    rPopLPush: RPOPLPUSH,
    rpoplpush: RPOPLPUSH,
    RPUSH,
    rPush: RPUSH,
    rpush: RPUSH,
    RPUSHX,
    rPushX: RPUSHX,
    rpushx: RPUSHX,
    SADD,
    sAdd: SADD,
    sadd: SADD,
    SCARD,
    sCard: SCARD,
    scard: SCARD,
    SDIFF,
    sDiff: SDIFF,
    sdiff: SDIFF,
    SDIFFSTORE,
    sDiffStore: SDIFFSTORE,
    sdiffstore: SDIFFSTORE,
    SINTER,
    sInter: SINTER,
    sinter: SINTER,
    SINTERSTORE,
    sInterStore: SINTERSTORE,
    sinterstore: SINTERSTORE,
    SET,
    set: SET,
    SETBIT,
    setBit: SETBIT,
    setbit: SETBIT,
    SETEX,
    setEx: SETEX,
    setex: SETEX,
    SETNX,
    setNX: SETNX,
    setnx: SETNX,
    SETRANGE,
    setRange: SETRANGE,
    setrange: SETRANGE,
    SISMEMBER,
    sIsMember: SISMEMBER,
    sismember: SISMEMBER,
    SMEMBERS,
    sMembers: SMEMBERS,
    smembers: SMEMBERS,
    SMISMEMBER,
    smIsMember: SMISMEMBER,
    smismember: SMISMEMBER,
    SMOVE,
    sMove: SMOVE,
    smove: SMOVE,
    SORT,
    sort: SORT,
    SPOP,
    sPop: SPOP,
    spop: SPOP,
    SRANDMEMBER_COUNT,
    sRandMemberCount: SRANDMEMBER_COUNT,
    srandmember_count: SRANDMEMBER_COUNT,
    SRANDMEMBER,
    sRandMember: SRANDMEMBER,
    srandmember: SRANDMEMBER,
    SREM,
    sRem: SREM,
    srem: SREM,
    SSCAN,
    sScan: SSCAN,
    sscan: SSCAN,
    STRLEN,
    strLen: STRLEN,
    strlen: STRLEN,
    SUNION,
    sUnion: SUNION,
    sunion: SUNION,
    SUNIONSTORE,
    sUnionStore: SUNIONSTORE,
    sunionstore: SUNIONSTORE,
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
    xack: XACK,
    XADD,
    xAdd: XADD,
    xadd: XADD,
    XAUTOCLAIM_JUSTID,
    xAutoClaimJustId: XAUTOCLAIM_JUSTID,
    xautoclaim_justid: XAUTOCLAIM_JUSTID,
    XAUTOCLAIM,
    xAutoClaim: XAUTOCLAIM,
    xautoclaim: XAUTOCLAIM,
    XCLAIM,
    xClaim: XCLAIM,
    xclaim: XCLAIM,
    XCLAIM_JUSTID,
    xClaimJustId: XCLAIM_JUSTID,
    xclaim_justid: XCLAIM_JUSTID,
    XDEL,
    xDel: XDEL,
    xdel: XDEL,
    XGROUP_CREATE,
    xGroupCreate: XGROUP_CREATE,
    xgroup_create: XGROUP_CREATE,
    XGROUP_CREATECONSUMER,
    xGroupCreateConsumer: XGROUP_CREATECONSUMER,
    xgroup_createconsumer: XGROUP_CREATECONSUMER,
    XGROUP_DELCONSUMER,
    xGroupDelConsumer: XGROUP_DELCONSUMER,
    xgroup_delconsumer: XGROUP_DELCONSUMER,
    XGROUP_DESTROY,
    xGroupDestroy: XGROUP_DESTROY,
    xgroup_destroy: XGROUP_DESTROY,
    XGROUP_SETID,
    xGroupSetId: XGROUP_SETID,
    xgroup_setid: XGROUP_SETID,
    XINFO_CONSUMERS,
    xInfoConsumers: XINFO_CONSUMERS,
    xinfo_consumers: XINFO_CONSUMERS,
    XINFO_GROUPS,
    xInfoGroups: XINFO_GROUPS,
    xinfo_groups: XINFO_GROUPS,
    XINFO_STREAM,
    xInfoStream: XINFO_STREAM,
    xinfo_stream: XINFO_STREAM,
    XLEN,
    xLen: XLEN,
    xlen: XLEN,
    XPENDING_RANGE,
    xPendingRange: XPENDING_RANGE,
    xpending_range: XPENDING_RANGE,
    XPENDING,
    xPending: XPENDING,
    xpending: XPENDING,
    XRANGE,
    xRange: XRANGE,
    xrange: XRANGE,
    XREAD,
    xRead: XREAD,
    xread: XREAD,
    XREADGROUP,
    xReadGroup: XREADGROUP,
    xreadgroup: XREADGROUP,
    XREVRANGE,
    xRevRange: XREVRANGE,
    xrevrange: XREVRANGE,
    XTRIM,
    xTrim: XTRIM,
    xtrim: XTRIM,
    ZADD,
    zAdd: ZADD,
    zadd: ZADD,
    ZCARD,
    zCard: ZCARD,
    zcard: ZCARD,
    ZCOUNT,
    zCount: ZCOUNT,
    zcount: ZCOUNT,
    ZDIFF_WITHSCORES,
    zDiffWithScores: ZDIFF_WITHSCORES,
    zdiff_withscores: ZDIFF_WITHSCORES,
    ZDIFF,
    zDiff: ZDIFF,
    zdiff: ZDIFF,
    ZDIFFSTORE,
    zDiffStore: ZDIFFSTORE,
    zdiffstore: ZDIFFSTORE,
    ZINCRBY,
    zIncrBy: ZINCRBY,
    zincrby: ZINCRBY,
    ZINTER_WITHSCORES,
    zInterWithScores: ZINTER_WITHSCORES,
    zinter_withscores: ZINTER_WITHSCORES,
    ZINTER,
    zInter: ZINTER,
    zinter: ZINTER,
    ZINTERSTORE,
    zInterStore: ZINTERSTORE,
    zinterstore: ZINTERSTORE,
    ZLEXCOUNT,
    zLexCount: ZLEXCOUNT,
    zlexcount: ZLEXCOUNT,
    ZMSCORE,
    zmScore: ZMSCORE,
    zmscore: ZMSCORE,
    ZPOPMAX_COUNT,
    zPopMaxCount: ZPOPMAX_COUNT,
    zpopmax_count: ZPOPMAX_COUNT,
    ZPOPMAX,
    zPopMax: ZPOPMAX,
    zpopmax: ZPOPMAX,
    ZPOPMIN_COUNT,
    zPopMinCount: ZPOPMIN_COUNT,
    zpopmin_count: ZPOPMIN_COUNT,
    ZPOPMIN,
    zPopMin: ZPOPMIN,
    zpopmin: ZPOPMIN,
    ZRANDMEMBER_COUNT_WITHSCORES,
    zRandMemberCountWithScores: ZRANDMEMBER_COUNT_WITHSCORES,
    zrandmember_count_withscores: ZRANDMEMBER_COUNT_WITHSCORES,
    ZRANDMEMBER_COUNT,
    zRandMemberCount: ZRANDMEMBER_COUNT,
    zrandmember_count: ZRANDMEMBER_COUNT,
    ZRANDMEMBER,
    zRandMember: ZRANDMEMBER,
    zrandmember: ZRANDMEMBER,
    ZRANGE_WITHSCORES,
    zRangeWithScores: ZRANGE_WITHSCORES,
    zrange_withscores: ZRANGE_WITHSCORES,
    ZRANGE,
    zRange: ZRANGE,
    zrange: ZRANGE,
    ZRANGEBYLEX,
    zRangeByLex: ZRANGEBYLEX,
    zrangebylex: ZRANGEBYLEX,
    ZRANGEBYSCORE_WITHSCORES,
    zRangeByScoreWithScores: ZRANGEBYSCORE_WITHSCORES,
    zrangebyscore_withscores: ZRANGEBYSCORE_WITHSCORES,
    ZRANGEBYSCORE,
    zRangeByScore: ZRANGEBYSCORE,
    zrangebyscore: ZRANGEBYSCORE,
    ZRANGESTORE,
    zRangeStore: ZRANGESTORE,
    zrangestore: ZRANGESTORE,
    ZRANK,
    zRank: ZRANK,
    zrank: ZRANK,
    ZREM,
    zRem: ZREM,
    zrem: ZREM,
    ZREMRANGEBYLEX,
    zRemRangeByLex: ZREMRANGEBYLEX,
    zremrangebylex: ZREMRANGEBYLEX,
    ZREMRANGEBYRANK,
    zRemRangeByRank: ZREMRANGEBYRANK,
    zremrangebyrank: ZREMRANGEBYRANK,
    ZREMRANGEBYSCORE,
    zRemRangeByScore: ZREMRANGEBYSCORE,
    zremrangebyscore: ZREMRANGEBYSCORE,
    ZREVRANK,
    zRevRank: ZREVRANK,
    zrevrank: ZREVRANK,
    ZSCAN,
    zScan: ZSCAN,
    zscan: ZSCAN,
    ZSCORE,
    zScore: ZSCORE,
    zscore: ZSCORE,
    ZUNION_WITHSCORES,
    zUnionWithScores: ZUNION_WITHSCORES,
    zunion_withscores: ZUNION_WITHSCORES,
    ZUNION,
    zUnion: ZUNION,
    zunion: ZUNION,
    ZUNIONSTORE,
    zUnionStore: ZUNIONSTORE,
    zunionstore: ZUNIONSTORE,
};
