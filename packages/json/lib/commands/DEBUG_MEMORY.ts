import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface JsonDebugMemoryOptions {
  path?: RedisArgument;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Reports memory usage details for a JSON document value.
   * Returns size in bytes of the value, or null if the key or path does not exist.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the value to examine
   */
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonDebugMemoryOptions) {
    parser.push('JSON.DEBUG', 'MEMORY');
    parser.pushKey(key);

    if (options?.path !== undefined) {
      parser.push(options.path);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
