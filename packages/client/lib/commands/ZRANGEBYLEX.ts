import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { transformStringDoubleArgument } from './generic-transformers';

export interface ZRangeByLexOptions {
  LIMIT?: {
    offset: number;
    count: number;
  };
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    min: RedisArgument,
    max: RedisArgument,
    options?: ZRangeByLexOptions
  ) {
    const args = [
      'ZRANGEBYLEX',
      key,
      transformStringDoubleArgument(min),
      transformStringDoubleArgument(max)
    ];

    if (options?.LIMIT) {
      args.push('LIMIT', options.LIMIT.offset.toString(), options.LIMIT.count.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
