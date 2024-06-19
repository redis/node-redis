import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('PERSIST');
    parser.pushKey(key);
  },
  transformArguments(key: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
