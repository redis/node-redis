import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
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
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    min: string | number,
    max: string | number,
    options?: ZRangeByScoreOptions
  ) {
    parser.setCachable();
    parser.push('ZRANGEBYSCORE');
    parser.pushKey(key);
    parser.pushVariadic(
      [
        transformStringDoubleArgument(min),
        transformStringDoubleArgument(max)
      ]
    );

    if (options?.LIMIT) {
      parser.pushVariadic(['LIMIT', options.LIMIT.offset.toString(), options.LIMIT.count.toString()]);
    }
  },
  transformArguments(
    key: RedisArgument,
    min: string | number,
    max: string | number,
    options?: ZRangeByScoreOptions
  ) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
