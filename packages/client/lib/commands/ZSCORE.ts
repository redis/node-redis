
import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformNullableDoubleReply } from './generic-transformers';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisArgument) {
    parser.push('ZSCORE');
    parser.pushKey(key);
    parser.push(member);
  },
  transformReply: transformNullableDoubleReply
} as const satisfies Command;
