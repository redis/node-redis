import * as ARRAPPEND from "./ARRAPPEND";
import * as ARRINDEX from "./ARRINDEX";
import * as ARRINSERT from "./ARRINSERT";
import * as ARRLEN from "./ARRLEN";
import * as ARRPOP from "./ARRPOP";
import * as ARRTRIM from "./ARRTRIM";
import * as DEBUG_MEMORY from "./DEBUG_MEMORY";
import * as DEL from "./DEL";
import * as FORGET from "./FORGET";
import * as GET from "./GET";
import * as MERGE from "./MERGE";
import * as MGET from "./MGET";
import * as MSET from "./MSET";
import * as NUMINCRBY from "./NUMINCRBY";
import * as NUMMULTBY from "./NUMMULTBY";
import * as OBJKEYS from "./OBJKEYS";
import * as OBJLEN from "./OBJLEN";
import * as RESP from "./RESP";
import * as SET from "./SET";
import * as STRAPPEND from "./STRAPPEND";
import * as STRLEN from "./STRLEN";
import * as TYPE from "./TYPE";

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
  MERGE,
  merge: MERGE,
  MGET,
  mGet: MGET,
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
  RESP,
  resp: RESP,
  SET,
  set: SET,
  STRAPPEND,
  strAppend: STRAPPEND,
  STRLEN,
  strLen: STRLEN,
  TYPE,
  type: TYPE,
};

// https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ValkeyJSONArray extends Array<ValkeyJSON> {}
interface ValkeyJSONObject {
  [key: string]: ValkeyJSON;
  [key: number]: ValkeyJSON;
}
export type ValkeyJSON =
  | null
  | boolean
  | number
  | string
  | Date
  | ValkeyJSONArray
  | ValkeyJSONObject;

export function transformValkeyJsonArgument(json: ValkeyJSON): string {
  return JSON.stringify(json);
}

export function transformValkeyJsonReply(json: string): ValkeyJSON {
  return JSON.parse(json);
}

export function transformValkeyJsonNullReply(
  json: string | null
): ValkeyJSON | null {
  if (json === null) return null;

  return transformValkeyJsonReply(json);
}

export function transformNumbersReply(reply: string): number | Array<number> {
  return JSON.parse(reply);
}
