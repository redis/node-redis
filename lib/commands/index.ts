import * as APPEND from './APPEND';
import * as AUTH from './AUTH';
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
import * as PING from './PING';
import * as PUBLISH from './PUBLISH';
import * as READONLY from './READONLY';
import * as SCAN from './SCAN';
import * as SET from './SET';

export default {
    APPEND,
    append: APPEND,
    AUTH,
    auth: AUTH,
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
    PING,
    ping: PING,
    PUBLISH,
    publish: PUBLISH,
    READONLY,
    readOnly: READONLY,
    SCAN,
    scan: SCAN,
    SET,
    set: SET
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
