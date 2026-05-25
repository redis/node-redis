import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, index: number | string) {
    parser.push('ARSEEK');
    parser.pushKey(key);
    parser.push(index.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
