import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command, } from '../RESP/types';
import { ZKeys, parseZKeysArguments } from './generic-transformers';

export interface ZUnionOptions {
  AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export default {
  IS_READ_ONLY: false,
  /**
   * Stores the union of multiple sorted sets in a new sorted set.
   * @param parser - The Redis command parser.
   * @param destination - Destination key where the result will be stored.
   * @param keys - Keys of the sorted sets to combine.
   * @param options - Optional parameters for the union operation.
   */
  parseCommand(
    parser: CommandParser,
    destination: RedisArgument,
    keys: ZKeys,
    options?: ZUnionOptions
  ): any {
    parser.push('ZUNIONSTORE');
    parser.pushKey(destination);
    parseZKeysArguments(parser, keys);
    
    if (options?.AGGREGATE) {
      parser.push('AGGREGATE', options.AGGREGATE);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
