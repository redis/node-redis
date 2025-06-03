import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { transformStringDoubleArgument } from './generic-transformers';

export interface ZRangeByLexOptions {
  LIMIT?: {
    offset: number;
    count: number;
  };
}

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Returns all the elements in the sorted set at key with a lexicographical value between min and max.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param min - Minimum lexicographical value.
   * @param max - Maximum lexicographical value.
   * @param options - Optional parameters including LIMIT.
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    min: RedisArgument,
    max: RedisArgument,
    options?: ZRangeByLexOptions
  ) {
    parser.push('ZRANGEBYLEX');
    parser.pushKey(key);
    parser.push(
      transformStringDoubleArgument(min),
      transformStringDoubleArgument(max)
    );

    if (options?.LIMIT) {
      parser.push('LIMIT', options.LIMIT.offset.toString(), options.LIMIT.count.toString());
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
