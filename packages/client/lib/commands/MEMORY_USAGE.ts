import { CommandParser } from '../client/parser';
import { NumberReply, NullReply, Command, RedisArgument } from '../RESP/types';

export interface MemoryUsageOptions {
  SAMPLES?: number;
}

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the MEMORY USAGE command
   * 
   * @param parser - The command parser
   * @param key - The key to get memory usage for
   * @param options - Optional parameters including SAMPLES
   * @see https://redis.io/commands/memory-usage/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, options?: MemoryUsageOptions) {
    parser.push('MEMORY', 'USAGE');
    parser.pushKey(key);

    if (options?.SAMPLES) {
      parser.push('SAMPLES', options.SAMPLES.toString());
    }
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
