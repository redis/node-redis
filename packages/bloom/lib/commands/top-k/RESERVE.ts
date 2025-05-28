import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';

export interface TopKReserveOptions {
  width: number;
  depth: number;
  decay: number;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Creates a new Top-K filter with specified parameters
   * @param parser - The command parser
   * @param key - The name of the Top-K filter
   * @param topK - Number of top occurring items to keep
   * @param options - Optional parameters for filter configuration
   * @param options.width - Number of counters in each array
   * @param options.depth - Number of counter-arrays
   * @param options.decay - Counter decay factor
   */
  parseCommand(parser: CommandParser, key: RedisArgument, topK: number, options?: TopKReserveOptions) {
    parser.push('TOPK.RESERVE');
    parser.pushKey(key);
    parser.push(topK.toString());

    if (options) {
      parser.push(
        options.width.toString(),
        options.depth.toString(),
        options.decay.toString()
      );
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
