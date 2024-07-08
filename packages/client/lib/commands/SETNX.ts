import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(parser: CommandParser, key: RedisArgument, value: RedisArgument) {
    parser.push('SETNX');
    parser.pushKey(key);
    parser.push(value);
  },
  transformArguments(key: RedisArgument, value: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
