import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(parser: CommandParser, key: RedisArgument, decrement: number) {
    parser.push('DECRBY');
    parser.pushKey(key);
    parser.push(decrement.toString());
  },
  transformArguments(key: RedisArgument, decrement: number) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
