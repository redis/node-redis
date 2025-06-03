import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { transformStringDoubleArgument } from './generic-transformers';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Returns the number of elements in the sorted set with a score between min and max.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param min - Minimum score to count from (inclusive).
   * @param max - Maximum score to count to (inclusive).
   */
  parseCommand(
    parser: CommandParser, 
    key: RedisArgument,
    min: number | RedisArgument,
    max: number | RedisArgument
  ) {
    parser.push('ZCOUNT');
    parser.pushKey(key);
    parser.push(
      transformStringDoubleArgument(min), 
      transformStringDoubleArgument(max)
    );
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
