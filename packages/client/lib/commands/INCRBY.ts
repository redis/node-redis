import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, increment: number) {
    parser.push('INCRBY');
    parser.pushKey(key);
    parser.push(increment.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
