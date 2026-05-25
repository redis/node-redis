import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, value: RedisArgument) {
    parser.push('SETNX');
    parser.pushKey(key);
    parser.push(value);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
