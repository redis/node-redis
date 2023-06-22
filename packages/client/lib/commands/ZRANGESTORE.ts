import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { transformStringDoubleArgument } from './generic-transformers';

export interface ZRangeStoreOptions {
  BY?: 'SCORE' | 'LEX';
  REV?: true;
  LIMIT?: {
    offset: number;
    count: number;
  };
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    destination: RedisArgument,
    source: RedisArgument,
    min: RedisArgument | number,
    max: RedisArgument | number,
    options?: ZRangeStoreOptions
  ) {
    const args = [
      'ZRANGESTORE',
      destination,
      source,
      transformStringDoubleArgument(min),
      transformStringDoubleArgument(max)
    ];

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
      args.push('LIMIT', options.LIMIT.offset.toString(), options.LIMIT.count.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
