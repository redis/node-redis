import ARRAPPEND from './ARRAPPEND';
import ARRINDEX from './ARRINDEX';
import ARRINSERT from './ARRINSERT';
import ARRLEN from './ARRLEN';
// import ARRPOP from './ARRPOP';
import ARRTRIM from './ARRTRIM';
import CLEAR from './CLEAR';
import DEBUG_MEMORY from './DEBUG_MEMORY';
import DEL from './DEL';
import FORGET from './FORGET';
// import GET from './GET';
// import MGET from './MGET';
import MSET from './MSET';
import NUMINCRBY from './NUMINCRBY';
import NUMMULTBY from './NUMMULTBY';
import OBJKEYS from './OBJKEYS';
import OBJLEN from './OBJLEN';
// import RESP from './RESP';
import SET from './SET';
import STRAPPEND from './STRAPPEND';
import STRLEN from './STRLEN';
import TOGGLE from './TOGGLE';
import TYPE from './TYPE';

export default {
  ARRAPPEND,
  arrAppend: ARRAPPEND,
  ARRINDEX,
  arrIndex: ARRINDEX,
  ARRINSERT,
  arrInsert: ARRINSERT,
  ARRLEN,
  arrLen: ARRLEN,
  // ARRPOP,
  // arrPop: ARRPOP,
  ARRTRIM,
  arrTrim: ARRTRIM,
  CLEAR,
  clear: CLEAR,
  DEBUG_MEMORY,
  debugMemory: DEBUG_MEMORY,
  DEL,
  del: DEL,
  FORGET,
  forget: FORGET,
  // GET,
  // get: GET,
  // MGET,
  // mGet: MGET,
  MSET,
  mSet: MSET,
  NUMINCRBY,
  numIncrBy: NUMINCRBY,
  NUMMULTBY,
  numMultBy: NUMMULTBY,
  OBJKEYS,
  objKeys: OBJKEYS,
  OBJLEN,
  objLen: OBJLEN,
  // RESP,
  // resp: RESP,
  SET,
  set: SET,
  STRAPPEND,
  strAppend: STRAPPEND,
  STRLEN,
  strLen: STRLEN,
  TOGGLE,
  toggle: TOGGLE,
  TYPE,
  type: TYPE
};

// https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface RedisJSONArray extends Array<RedisJSON> { }
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
