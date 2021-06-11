import * as APPEND from './APPEND';
import * as AUTH from './AUTH';
import * as BITCOUNT from './BITCOUNT';
import * as BITFIELD from './BITFIELD';
import * as BLPOP from './BLPOP';
import * as CLIENT_INFO from './CLIENT_INFO';
import * as CLUSTER_NODES from './CLUSTER_NODES';
import * as COPY from './COPY';
import * as DECR from './DECR';
import * as DECRBY from './DECRBY';
import * as DEL from './DEL';
import * as DUMP from './DUMP';
import * as EXISTS from './EXISTS';
import * as EXPIRE from './EXPIRE';
import * as EXPIREAT from './EXPIREAT';
import * as FLUSHALL from './FLUSHALL';
import * as GET from './GET';
import * as HDEL from './HDEL';
import * as HEXISTS from './HEXISTS';
import * as HGET from './HGET';
import * as HGETALL from './HGETALL';
import * as HINCRBY from './HINCRBY';
import * as HINCRBYFLOAT from './HINCRBYFLOAT';
import * as HKEYS from './HKEYS';
import * as HLEN from './HLEN';
import * as HMGET from './HMGET';
import * as HRANDFIELD from './HRANDFIELD';
import * as HSET from './HSET';
import * as HSETNX from './HSETNX';
import * as HSTRLEN from './HSTRLEN';
import * as HVALS from './HVALS';
import * as INCR from './INCR';
import * as INCRBY from './INCRBY';
import * as INCRBYFLOAT from './INCRBYFLOAT';
import * as KEYS from './KEYS';
import * as LPUSH from './LPUSH';
import * as PERSIST from './PERSIST';
import * as PEXPIRE from './PEXPIRE';
import * as PEXPIREAT from './PEXPIREAT';
import * as PFADD from './PFADD';
import * as PFCOUNT from './PFCOUNT';
import * as PFMERGE from './PFMERGE';
import * as PING from './PING';
import * as PTTL from './PTTL';
import * as PUBLISH from './PUBLISH';
import * as RANDOMKEY from './RANDOMKEY';
import * as READONLY from './READONLY';
import * as RENAME from './RENAME';
import * as RENAMENX from './RENAMENX';
import * as SADD from './SADD';
import * as SCAN from './SCAN';
import * as SCARD from './SCARD';
import * as SDIFF from './SDIFF';
import * as SDIFFSTORE from './SDIFFSTORE';
import * as SET from './SET';
import * as SINTER from './SINTER';
import * as SINTERSTORE from './SINTERSTORE';
import * as SISMEMBER from './SISMEMBER';
import * as SMEMBERS from './SMEMBERS';
import * as SMISMEMBER from './SMISMEMBER';
import * as SMOVE from './SMOVE';
import * as SORT from './SORT';
import * as SPOP from './SPOP';
import * as SRANDMEMBER from './SRANDMEMBER';
import * as SREM from './SREM';
import * as SSCAN from './SSCAN';
import * as SUNION from './SUNION';
import * as SUNIONSTORE from './SUNIONSTORE';
import * as TOUCH from './TOUCH';
import * as TTL from './TTL';
import * as TYPE from './TYPE';
import * as UNLINK from './UNLINK';
import * as WAIT from './WAIT';

export default {
    APPEND,
    append: APPEND,
    AUTH,
    auth: AUTH,
    BITCOUNT,
    bitCount: BITCOUNT,
    BITFIELD,
    bitField: BITFIELD,
    BLPOP,
    blPop: BLPOP,
    CLIENT_INFO,
    clientInfo: CLIENT_INFO,
    CLUSTER_NODES,
    clusterNodes: CLUSTER_NODES,
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
    EXISTS,
    exists: EXISTS,
    EXPIRE,
    expire: EXPIRE,
    EXPIREAT,
    expireAt: EXPIREAT,
    FLUSHALL,
    flushAll: FLUSHALL,
    GET,
    get: GET,
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
    HRANDFIELD,
    hRandField: HRANDFIELD,
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
    KEYS,
    keys: KEYS,
    LPUSH,
    lPush: LPUSH,
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
    PTTL,
    pTTL: PTTL,
    PUBLISH,
    publish: PUBLISH,
    RANDOMKEY,
    randomKey: RANDOMKEY,
    READONLY,
    readonly: READONLY,
    RENAME,
    rename: RENAME,
    RENAMENX,
    renameNX: RENAMENX,
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
    SINTER,
    sInter: SINTER,
    SINTERSTORE,
    sInterStore: SINTERSTORE,
    SET,
    set: SET,
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
    SRANDMEMBER,
    sRandMember: SRANDMEMBER,
    SREM,
    sRem: SREM,
    SSCAN,
    sScan: SSCAN,
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
    WAIT,
    wait: WAIT
};

export type RedisReply = string | number | Array<RedisReply> | null | undefined;

export interface RedisCommand {
    FIRST_KEY_INDEX?: number;
    IS_READ_ONLY?: boolean;
    transformArguments(...args: Array<any>): Array<string>;
    transformReply(reply: RedisReply): any;
}

export interface RedisModule {
    [key: string]: RedisCommand;
}

export type RedisModules = Array<RedisModule>;
