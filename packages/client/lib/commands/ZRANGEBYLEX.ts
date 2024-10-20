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
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    min: RedisArgument,
    max: RedisArgument,
    options?: ZRangeByLexOptions
  ) {
    parser.setCachable();
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
