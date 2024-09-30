import { RedisCommandArgument } from '.';
import { pushVerdictArgument } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: RedisCommandArgument, fields: RedisCommandArgument | Array<RedisCommandArgument>) {
  return pushVerdictArgument(['HPERSIST', key, 'FIELDS'], fields);
}

export declare function transformReply(): Array<number> | null;