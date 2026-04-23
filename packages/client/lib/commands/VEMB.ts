import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformDoubleArrayReply } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, element: RedisArgument) {
    parser.push('VEMB');
    parser.pushKey(key);
    parser.push(element);
  },
  transformReply: transformDoubleArrayReply
} as const satisfies Command;
