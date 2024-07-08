import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
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
  parseCommand(
    parser: CommandParser,
    destination: RedisArgument,
    source: RedisArgument,
    min: RedisArgument | number,
    max: RedisArgument | number,
    options?: ZRangeStoreOptions
  ) {
    parser.push('ZRANGESTORE');
    parser.pushKey(destination);
    parser.pushKey(source);
    parser.pushVariadic([transformStringDoubleArgument(min), transformStringDoubleArgument(max)]);

    switch (options?.BY) {
      case 'SCORE':
        parser.push('BYSCORE');
        break;

      case 'LEX':
        parser.push('BYLEX');
        break;
    }

    if (options?.REV) {
      parser.push('REV');
    }

    if (options?.LIMIT) {
      parser.pushVariadic(['LIMIT', options.LIMIT.offset.toString(), options.LIMIT.count.toString()]);
    }
  },
  transformArguments(
    destination: RedisArgument,
    source: RedisArgument,
    min: RedisArgument | number,
    max: RedisArgument | number,
    options?: ZRangeStoreOptions
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
