import { RedisCommandArgument } from '.';
import { pushVerdictArgument } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;
export const IS_READ_ONLY = true;

export function transformArguments(key: RedisCommandArgument, fields: RedisCommandArgument | Array<RedisCommandArgument>) {
  return pushVerdictArgument(['HPEXPIRETIME', key, 'FIELDS'], fields);
}

export declare function transformReply(): Array<number> | null;