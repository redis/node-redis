import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { transformStringDoubleArgument } from './generic-transformers';

export interface ZRangeOptions {
  BY?: 'SCORE' | 'LEX';
  REV?: boolean;
  LIMIT?: {
    offset: number;
    count: number;
  };
}

export function zRangeArgument(
  min: RedisArgument | number,
  max: RedisArgument | number,
  options?: ZRangeOptions
) {
  const args = [
    transformStringDoubleArgument(min),
    transformStringDoubleArgument(max)
  ]

  switch (options?.BY) {
    case 'SCORE':
      args.push('BYSCORE');
      break;

    case 'LEX':
      args.push('BYLEX');
      break;
  }

  if (options?.REV) {
    args.push('REV');
  }

  if (options?.LIMIT) {
    args.push(
      'LIMIT',
      options.LIMIT.offset.toString(),
      options.LIMIT.count.toString()
    );
  }

  return args;
}

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Returns the specified range of elements in the sorted set.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param min - Minimum index, score or lexicographical value.
   * @param max - Maximum index, score or lexicographical value.
   * @param options - Optional parameters for range retrieval (BY, REV, LIMIT).
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    min: RedisArgument | number,
    max: RedisArgument | number,
    options?: ZRangeOptions
  ) {
    parser.push('ZRANGE');
    parser.pushKey(key);
    parser.pushVariadic(zRangeArgument(min, max, options))
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
