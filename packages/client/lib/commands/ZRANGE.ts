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
