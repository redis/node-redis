import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface BitCountRange {
  start: number;
  end: number;
  mode?: 'BYTE' | 'BIT';
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, range?: BitCountRange) {
    parser.setCachable();
    parser.push('BITCOUNT');
    parser.pushKey(key);
    if (range) {
      parser.push(range.start.toString());
      parser.push(range.end.toString());

      if (range.mode) {
        parser.push(range.mode);
      }
    }
  },
  transformArguments(key: RedisArgument, range?: BitCountRange) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
