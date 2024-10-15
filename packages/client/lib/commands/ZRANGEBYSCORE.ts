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
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    min: string | number,
    max: string | number,
    options?: ZRangeByScoreOptions
  ) {
    const args = [
      'ZRANGEBYSCORE',
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
