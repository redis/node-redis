import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, decrement: number) {
    parser.push('DECRBY');
    parser.pushKey(key);
    parser.push(decrement.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
