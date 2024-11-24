import { CommandParser } from '../client/parser';
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
    parser.push(
      transformStringDoubleArgument(min), 
      transformStringDoubleArgument(max)
    );

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
      parser.push('LIMIT', options.LIMIT.offset.toString(), options.LIMIT.count.toString());
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
