import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Removes all elements in the sorted set with rank between start and stop.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param start - Minimum rank (starting from 0).
   * @param stop - Maximum rank.
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    start: number,
    stop: number
  ) {      
    parser.push('ZREMRANGEBYRANK');
    parser.pushKey(key);
    parser.push(
      start.toString(), 
      stop.toString()
    );
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
