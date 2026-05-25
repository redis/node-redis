import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformRedisJsonNullReply } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, element: RedisArgument) {
    parser.push('VGETATTR');
    parser.pushKey(key);
    parser.push(element);
  },
  transformReply: transformRedisJsonNullReply
} as const satisfies Command;
