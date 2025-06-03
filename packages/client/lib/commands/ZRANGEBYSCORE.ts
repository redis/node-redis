import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { transformStringDoubleArgument } from './generic-transformers';

export interface ZRangeByScoreOptions {
  LIMIT?: {
    offset: number;
    count: number;
  };
}

export declare function transformReply(): Array<RedisArgument>;

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Returns all the elements in the sorted set with a score between min and max.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param min - Minimum score.
   * @param max - Maximum score.
   * @param options - Optional parameters including LIMIT.
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    min: string | number,
    max: string | number,
    options?: ZRangeByScoreOptions
  ) {
    parser.push('ZRANGEBYSCORE');
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
