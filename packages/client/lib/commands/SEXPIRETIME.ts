import { CommandParser } from '../client/parser';
import { ArrayReply, Command, NumberReply, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export const SET_EXPIRATION_TIME = {
  /** The member does not exist */
  MEMBER_NOT_EXISTS: -2,
  /** The member exists but has no associated expire */
  NO_EXPIRATION: -1
} as const;

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    members: RedisVariadicArgument
  ) {
    parser.push('SEXPIRETIME');
    parser.pushKey(key);
    parser.push('MEMBERS');
    parser.pushVariadicWithLength(members);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
