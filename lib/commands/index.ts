import * as APPEND from './APPEND.js';
import * as AUTH from './AUTH.js';
import * as CLUSTER_NODES from './CLUSTER_NODES.js';
import * as COPY from './COPY.js';
import * as DECR from './DECR.js';
import * as DECRBY from './DECRBY.js';
import * as DEL from './DEL.js';
import * as DUMP from './DUMP.js';
import * as EXISTS from './EXISTS.js';
import * as EXPIRE from './EXPIRE.js';
import * as EXPIREAT from './EXPIREAT.js';
import * as FLUSHALL from './FLUSHALL.js';
import * as GET from './GET.js';
import * as HDEL from './HDEL.js';
import * as HEXISTS from './HEXISTS.js';
import * as HGET from './HGET.js';
import * as HGETALL from './HGETALL.js';
import * as HINCRBY from './HINCRBY.js';
import * as HINCRBYFLOAT from './HINCRBYFLOAT.js';
import * as HKEYS from './HKEYS.js';
import * as HLEN from './HLEN.js';
import * as HSET from './HSET.js';
import * as HVALS from './HVALS.js';
import * as INCR from './INCR.js';
import * as INCRBY from './INCRBY.js';
import * as INCRBYFLOAT from './INCRBYFLOAT.js';
import * as KEYS from './KEYS.js';
import * as PING from './PING.js';
import * as SET from './SET.js';

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
