import { CommandParser } from '../client/parser';
import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { transformStringDoubleArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Removes all elements in the sorted set with lexicographical values between min and max.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param min - Minimum lexicographical value.
   * @param max - Maximum lexicographical value.
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    min: RedisArgument | number,
    max: RedisArgument | number
  ) {
    parser.push('ZREMRANGEBYLEX');
    parser.pushKey(key);
    parser.push(
      transformStringDoubleArgument(min),
      transformStringDoubleArgument(max)
    );
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
