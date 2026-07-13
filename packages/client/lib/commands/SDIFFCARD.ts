import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

/**
 * Options for the SDIFFCARD command
 *
 * @property LIMIT - Cap the returned cardinality at this value; `LIMIT 0` means no limit
 */
export interface SDiffCardOptions {
  LIMIT?: number;
}

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument, options?: SDiffCardOptions) {
    parser.push('SDIFFCARD');
    parser.pushKeysLength(keys);

    if (options?.LIMIT !== undefined) {
      parser.push('LIMIT', options.LIMIT.toString());
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
