import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    ms: number,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    parser.push('PEXPIRE');
    parser.pushKey(key);
    parser.push(ms.toString());

    if (mode) {
      parser.push(mode);
    }
  },
  transformArguments(
    key: RedisArgument,
    ms: number,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
