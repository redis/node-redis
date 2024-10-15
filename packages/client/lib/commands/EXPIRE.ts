import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    seconds: number,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    parser.push('EXPIRE');
    parser.pushKey(key);
    parser.push(seconds.toString());
    if (mode) {
      parser.push(mode);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
