import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface JsonStrLenOptions {
  path?: RedisArgument;
}

export default {
  IS_READ_ONLY: true,
  /**
   * Returns the length of a string value stored in a JSON document.
   * Returns string length, array of lengths for multiple paths, or null if path doesn't exist.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the string value
   */
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonStrLenOptions) {
    parser.push('JSON.STRLEN');
    parser.pushKey(key);

    if (options?.path) {
      parser.push(options.path);
    }
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
