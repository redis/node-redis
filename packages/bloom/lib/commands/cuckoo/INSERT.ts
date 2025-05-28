import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, transformBooleanArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export interface CfInsertOptions {
  CAPACITY?: number;
  NOCREATE?: boolean;
}

export function parseCfInsertArguments(
  parser: CommandParser, 
  key: RedisArgument,
  items: RedisVariadicArgument,
  options?: CfInsertOptions
) {
  parser.pushKey(key);

  if (options?.CAPACITY !== undefined) {
    parser.push('CAPACITY', options.CAPACITY.toString());
  }

  if (options?.NOCREATE) {
    parser.push('NOCREATE');
  }

  parser.push('ITEMS');
  parser.pushVariadic(items);
}

export default {
  IS_READ_ONLY: false,
  /**
   * Adds one or more items to a Cuckoo Filter, creating it if it does not exist
   * @param parser - The command parser
   * @param key - The name of the Cuckoo filter
   * @param items - One or more items to add to the filter
   * @param options - Optional parameters for filter creation
   * @param options.CAPACITY - The number of entries intended to be added to the filter
   * @param options.NOCREATE - If true, prevents automatic filter creation
   */
  parseCommand(...args: Parameters<typeof parseCfInsertArguments>) {
    args[0].push('CF.INSERT');
    parseCfInsertArguments(...args);
  },
  transformReply: transformBooleanArrayReply
} as const satisfies Command;
