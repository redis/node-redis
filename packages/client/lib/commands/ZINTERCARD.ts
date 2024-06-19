import { NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export interface ZInterCardOptions {
  LIMIT?: number;
}

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    keys: RedisVariadicArgument,
    options?: ZInterCardOptions['LIMIT'] | ZInterCardOptions
  ) {
    parser.push('ZINTERCARD');
    parser.pushKeysLength(keys);

    // backwards compatibility
    if (typeof options === 'number') {
      parser.pushVariadic(['LIMIT', options.toString()]);
    } else if (options?.LIMIT) {
      parser.pushVariadic(['LIMIT', options.LIMIT.toString()]);
    }
  },
  transformArguments(keys: RedisVariadicArgument, options?: ZInterCardOptions['LIMIT'] | ZInterCardOptions) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
