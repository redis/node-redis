import { NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export interface SInterCardOptions {
  LIMIT?: number;
}

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  // option `number` for backwards compatibility
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument, options?: SInterCardOptions | number) {
    parser.push('SINTERCARD');
    parser.pushKeysLength(keys);

    if (typeof options === 'number') { // backwards compatibility
      parser.pushVariadic(['LIMIT', options.toString()]);
    } else if (options?.LIMIT !== undefined) {
      parser.pushVariadic(['LIMIT', options.LIMIT.toString()]);
    }
  },
  transformArguments(keys: RedisVariadicArgument, options?: SInterCardOptions | number) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
