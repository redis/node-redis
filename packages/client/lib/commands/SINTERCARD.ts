import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export interface SInterCardOptions {
  LIMIT?: number;
}

export default {
  IS_READ_ONLY: true,
  // option `number` for backwards compatibility
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument, options?: SInterCardOptions | number) {
    parser.push('SINTERCARD');
    parser.pushKeysLength(keys);

    if (typeof options === 'number') { // backwards compatibility
      parser.push('LIMIT', options.toString());
    } else if (options?.LIMIT !== undefined) {
      parser.push('LIMIT', options.LIMIT.toString());
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
