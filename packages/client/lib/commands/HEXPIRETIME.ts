import { ArrayReply, Command, NumberReply, RedisArgument } from '../RESP/types';
import { pushVariadicArgument, RedisVariadicArgument } from './generic-transformers';

export const HASH_EXPIRATION_TIME = {
  /** The field does not exist */
  FIELD_NOT_EXISTS: -2,
  /** The field exists but has no associated expire */
  NO_EXPIRATION: -1,
} as const;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, fields: RedisVariadicArgument) {
    return pushVariadicArgument(['HEXPIRETIME', key, 'FIELDS'], fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
