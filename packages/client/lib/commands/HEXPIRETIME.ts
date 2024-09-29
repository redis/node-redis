import { RedisCommandArgument } from '.';
import { pushVerdictArgument } from './generic-transformers';

export const HASH_EXPIRATION_TIME = {
  /** @property {number} */
  /** The field does not exist */
  FIELD_NOT_EXISTS: -2,
  /** @property {number} */
  /** The field exists but has no associated expire */
  NO_EXPIRATION: -1,
} as const;

export const FIRST_KEY_INDEX = 1

export const IS_READ_ONLY = true;

export function transformArguments(key: RedisCommandArgument, fields: RedisCommandArgument | Array<RedisCommandArgument>) {
  return pushVerdictArgument(['HEXPIRETIME', key, 'FIELDS'], fields);
}

export declare function transformReply(): Array<number>;