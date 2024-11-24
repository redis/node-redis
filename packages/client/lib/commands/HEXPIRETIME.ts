import { CommandParser } from '../client/parser';
import { ArrayReply, Command, NumberReply, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export const HASH_EXPIRATION_TIME = {
  /** The field does not exist */
  FIELD_NOT_EXISTS: -2,
  /** The field exists but has no associated expire */
  NO_EXPIRATION: -1,
} as const;

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    fields: RedisVariadicArgument
  ) {
    parser.push('HEXPIRETIME');
    parser.pushKey(key);
    parser.push('FIELDS');
    parser.pushVariadicWithLength(fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
