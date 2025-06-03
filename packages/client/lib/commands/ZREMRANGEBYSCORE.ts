import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { transformStringDoubleArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Removes all elements in the sorted set with scores between min and max.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param min - Minimum score.
   * @param max - Maximum score.
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    min: RedisArgument | number,
    max: RedisArgument | number,
  ) {
    parser.push('ZREMRANGEBYSCORE');
    parser.pushKey(key);
    parser.push(
      transformStringDoubleArgument(min),
      transformStringDoubleArgument(max)
    );
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
