import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export interface BitCountRange {
  start: number;
  end: number;
  mode?: 'BYTE' | 'BIT';
}

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Returns the count of set bits in a string key
   * @param parser - The Redis command parser
   * @param key - The key to count bits in
   * @param range - Optional range specification
   * @param range.start - Start offset in bytes/bits
   * @param range.end - End offset in bytes/bits
   * @param range.mode - Optional counting mode: BYTE or BIT
   */
  parseCommand(parser: CommandParser, key: RedisArgument, range?: BitCountRange) {
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
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
