import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

/**
 * Options for the SUNIONCARD command
 *
 * @property APPROX - When true, return an approximate cardinality using HyperLogLog
 * @property LIMIT - Cap the returned cardinality at this value; `LIMIT 0` means no limit
 */
export interface SUnionCardOptions {
  APPROX?: boolean;
  LIMIT?: number;
}

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument, options?: SUnionCardOptions) {
    parser.push('SUNIONCARD');
    parser.pushKeysLength(keys);

    if (options?.APPROX) {
      parser.push('APPROX');
    }

    if (options?.LIMIT !== undefined) {
      parser.push('LIMIT', options.LIMIT.toString());
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
