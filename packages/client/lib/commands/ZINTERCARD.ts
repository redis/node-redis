import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export interface ZInterCardOptions {
  LIMIT?: number;
}

export default {
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
      parser.push('LIMIT', options.toString());
    } else if (options?.LIMIT) {
      parser.push('LIMIT', options.LIMIT.toString());
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
