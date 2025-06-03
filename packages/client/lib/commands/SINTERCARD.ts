import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

/**
 * Options for the SINTERCARD command
 * 
 * @property LIMIT - Maximum number of elements to return
 */
export interface SInterCardOptions {
  LIMIT?: number;
}

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the SINTERCARD command
   * 
   * @param parser - The command parser
   * @param keys - One or more set keys to compute the intersection cardinality from
   * @param options - Options for the SINTERCARD command or a number for LIMIT (backwards compatibility)
   * @see https://redis.io/commands/sintercard/
   */
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
