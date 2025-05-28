import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface CfReserveOptions {
  BUCKETSIZE?: number;
  MAXITERATIONS?: number;
  EXPANSION?: number;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Creates an empty Cuckoo Filter with specified capacity and parameters
   * @param parser - The command parser
   * @param key - The name of the Cuckoo filter to create
   * @param capacity - The number of entries intended to be added to the filter
   * @param options - Optional parameters to tune the filter
   * @param options.BUCKETSIZE - Number of items in each bucket
   * @param options.MAXITERATIONS - Maximum number of iterations before declaring filter full
   * @param options.EXPANSION - Number of additional buckets per expansion
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    capacity: number,
    options?: CfReserveOptions
  ) {
    parser.push('CF.RESERVE');
    parser.pushKey(key);
    parser.push(capacity.toString());

    if (options?.BUCKETSIZE !== undefined) {
      parser.push('BUCKETSIZE', options.BUCKETSIZE.toString());
    }

    if (options?.MAXITERATIONS !== undefined) {
      parser.push('MAXITERATIONS', options.MAXITERATIONS.toString());
    }

    if (options?.EXPANSION !== undefined) {
      parser.push('EXPANSION', options.EXPANSION.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
