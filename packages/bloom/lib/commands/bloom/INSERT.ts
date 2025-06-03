import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { transformBooleanArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export interface BfInsertOptions {
  CAPACITY?: number;
  ERROR?: number;
  EXPANSION?: number;
  NOCREATE?: boolean;
  NONSCALING?: boolean;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Adds one or more items to a Bloom Filter, creating it if it does not exist
   * @param parser - The command parser
   * @param key - The name of the Bloom filter
   * @param items - One or more items to add to the filter
   * @param options - Optional parameters for filter creation
   * @param options.CAPACITY - Desired capacity for a new filter
   * @param options.ERROR - Desired error rate for a new filter
   * @param options.EXPANSION - Expansion rate for a new filter
   * @param options.NOCREATE - If true, prevents automatic filter creation
   * @param options.NONSCALING - Prevents the filter from creating additional sub-filters
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    items: RedisVariadicArgument,
    options?: BfInsertOptions
  ) {
    parser.push('BF.INSERT');
    parser.pushKey(key);

    if (options?.CAPACITY !== undefined) {
      parser.push('CAPACITY', options.CAPACITY.toString());
    }

    if (options?.ERROR !== undefined) {
      parser.push('ERROR', options.ERROR.toString());
    }

    if (options?.EXPANSION !== undefined) {
      parser.push('EXPANSION', options.EXPANSION.toString());
    }

    if (options?.NOCREATE) {
      parser.push('NOCREATE');
    }

    if (options?.NONSCALING) {
      parser.push('NONSCALING');
    }

    parser.push('ITEMS');
    parser.pushVariadic(items);
  },
  transformReply: transformBooleanArrayReply
} as const satisfies Command;
