import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformBooleanReply } from './generic-transformers';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, element: RedisArgument) {
    parser.push('VREM');
    parser.pushKey(key);
    parser.push(element);
  },
  transformReply: transformBooleanReply
} as const satisfies Command;
