import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, ArrayReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface JsonObjLenOptions {
  path?: RedisArgument;
}

export default {
  IS_READ_ONLY: true,
  /**
   * Returns the number of keys in the object stored in a JSON document.
   * Returns length of object, array of lengths for multiple paths, or null if path doesn't exist.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the object to examine
   */
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonObjLenOptions) {
    parser.push('JSON.OBJLEN');
    parser.pushKey(key);
    if (options?.path !== undefined) {
      parser.push(options.path);
    }
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
