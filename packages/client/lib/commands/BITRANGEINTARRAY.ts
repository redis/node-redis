import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, NumberReply, Command } from '../RESP/types';

/**
 * Options for the BITRANGEINTARRAY command
 * @property mode - Whether `start` and `end` count bytes (`BYTE`, server default) or bits (`BIT`)
 * @property LIMIT - Return only the lowest `LIMIT` offsets in the range. In `BYTE` mode the server
 *   also returns the rest of the byte that holds the last offset, so the reply can hold up to 7 more
 * @property ZEROS - Return the offsets of the clear bits instead of the set bits
 */
export interface BitRangeIntArrayOptions {
  mode?: 'BYTE' | 'BIT';
  LIMIT?: number;
  ZEROS?: boolean;
}

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    start: number | string,
    end: number | string,
    options?: BitRangeIntArrayOptions
  ) {
    parser.push('BITRANGEINTARRAY');
    parser.pushKey(key);
    parser.push(start.toString(), end.toString());

    if (options?.mode) {
      parser.push(options.mode);
    }

    if (options?.LIMIT !== undefined) {
      parser.push('LIMIT', options.LIMIT.toString());
    }

    if (options?.ZEROS) {
      parser.push('ZEROS');
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
