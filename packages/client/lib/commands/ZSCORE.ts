
import { RedisArgument, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { transformNullableDoubleReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisArgument) {
    parser.setCachable();
    parser.push('ZSCORE');
    parser.pushKey(key);
    parser.push(member);
  },
  transformArguments(key: RedisArgument, member: RedisArgument) { return [] },
  transformReply: transformNullableDoubleReply
} as const satisfies Command;
