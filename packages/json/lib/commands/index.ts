import { BlobStringReply, NullReply, UnwrapReply } from '@redis/client/lib/RESP/types';
import ARRAPPEND from './ARRAPPEND';
import ARRINDEX from './ARRINDEX';
import ARRINSERT from './ARRINSERT';
import ARRLEN from './ARRLEN';
import ARRPOP from './ARRPOP';
import ARRTRIM from './ARRTRIM';
import CLEAR from './CLEAR';
import DEBUG_MEMORY from './DEBUG_MEMORY';
import DEL from './DEL';
import FORGET from './FORGET';
import GET from './GET';
import MERGE from './MERGE';
import MGET from './MGET';
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
import { isNullReply } from '@redis/client/lib/commands/generic-transformers';

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
  CLEAR,
  clear: CLEAR,
  DEBUG_MEMORY,
  debugMemory: DEBUG_MEMORY,
  DEL,
  del: DEL,
  FORGET,
  forget: FORGET,
  GET,
  get: GET,
  MERGE,
  merge: MERGE,
  MGET,
  mGet: MGET,
  MSET,
  mSet: MSET,
  NUMINCRBY,
  numIncrBy: NUMINCRBY,
  /**
   * @deprecated since JSON version 2.0
   */
  NUMMULTBY,
  /**
   * @deprecated since JSON version 2.0
   */
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

export type RedisJSON = null | boolean | number | string | Date | Array<RedisJSON> | {
  [key: string]: RedisJSON;
  [key: number]: RedisJSON;
};

export function transformRedisJsonArgument(json: RedisJSON): string {
  return JSON.stringify(json);
}

export function transformRedisJsonReply(json: BlobStringReply): RedisJSON {
  return JSON.parse((json as unknown as UnwrapReply<typeof json>).toString());
}

export function transformRedisJsonNullReply(json: NullReply | BlobStringReply): NullReply | RedisJSON {
  return isNullReply(json) ? json : transformRedisJsonReply(json);
}
