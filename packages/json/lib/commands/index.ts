import * as ARRAPPEND from './ARRAPPEND';
import * as ARRINDEX from './ARRINDEX';
import * as ARRINSERT from './ARRINSERT';
import * as ARRLEN from './ARRLEN';
import * as ARRPOP from './ARRPOP';
import * as ARRTRIM from './ARRTRIM';
import * as DEBUG_MEMORY from './DEBUG_MEMORY';
import * as DEL from './DEL';
import * as FORGET from './FORGET';
import * as GET from './GET';
import * as MGET from './MGET';
import * as NUMINCRBY from './NUMINCRBY';
import * as NUMMULTBY from './NUMMULTBY';
import * as OBJKEYS from './OBJKEYS';
import * as OBJLEN from './OBJLEN';
import * as RESP from './RESP';
import * as SET from './SET';
import * as STRAPPEND from './STRAPPEND';
import * as STRLEN from './STRLEN';
import * as TYPE from './TYPE';

export default {
    ARRAPPEND,
    arrAppend: ARRAPPEND,
    ARRINDEX,
    arrIndex: ARRINDEX,
    ARRINSERT,
    arrInsert: ARRINSERT,
    ARRLEN,
    arrLen: ARRLEN,
    ARRPOP,
    arrPop: ARRPOP,
    ARRTRIM,
    arrTrim: ARRTRIM,
    DEBUG_MEMORY,
    debugMemory: DEBUG_MEMORY,
    DEL,
    del: DEL,
    FORGET,
    forget: FORGET,
    GET,
    get: GET,
    MGET,
    mGet: MGET,
    NUMINCRBY,
    numIncrBy: NUMINCRBY,
    NUMMULTBY,
    numMultBy: NUMMULTBY,
    OBJKEYS,
    objKeys: OBJKEYS,
    OBJLEN,
    objLen: OBJLEN,
    RESP,
    resp: RESP,
    SET,
    set: SET,
    STRAPPEND,
    strAppend: STRAPPEND,
    STRLEN,
    strLen: STRLEN,
    TYPE,
    type: TYPE
};

// https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface RedisJSONArray extends Array<RedisJSON> {}
interface RedisJSONObject {
    [key: string]: RedisJSON;
    [key: number]: RedisJSON;
}
export type RedisJSON = null | boolean | number | string | Date | RedisJSONArray | RedisJSONObject;

export function transformRedisJsonArgument(json: RedisJSON): string {
    return JSON.stringify(json);
}

export function transformRedisJsonReply(json: string): RedisJSON {
    return JSON.parse(json);
}

export function transformRedisJsonNullReply(json: string | null): RedisJSON | null {
    if (json === null) return null;

    return transformRedisJsonReply(json);
}

export function transformNumbersReply(reply: string): number | Array<number> {
    return JSON.parse(reply);
}
