import * as APPEND from './APPEND';
import * as AUTH from './AUTH';
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
import * as HSET from './HSET';
import * as HVALS from './HVALS';
import * as INCR from './INCR';
import * as INCRBY from './INCRBY';
import * as INCRBYFLOAT from './INCRBYFLOAT';
import * as KEYS from './KEYS';
import * as PING from './PING';
import * as SET from './SET';

export default {
    APPEND,
    append: APPEND,
    AUTH,
    auth: AUTH,
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
    HSET,
    hSet: HSET,
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
    PING,
    ping: PING,
    SET,
    set: SET
};

export type RedisReply = string | number | Array<string> | null | undefined;

export interface RedisCommand {
    FIRST_KEY_INDEX?: number;
    transformArguments(...args: Array<any>): Array<string>;
    transformReply(reply: RedisReply): any;
}

export interface RedisModule {
    [key: string]: RedisCommand;
}

export type RedisModules = Array<RedisModule>;
