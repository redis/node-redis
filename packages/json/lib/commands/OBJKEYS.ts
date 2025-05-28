import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface JsonObjKeysOptions {
  path?: RedisArgument;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Returns the keys in the object stored in a JSON document.
   * Returns array of keys, array of arrays for multiple paths, or null if path doesn't exist.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the object to examine
   */
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonObjKeysOptions) {
    parser.push('JSON.OBJKEYS');
    parser.pushKey(key);
    if (options?.path !== undefined) {
      parser.push(options.path);
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply> | ArrayReply<ArrayReply<BlobStringReply> | NullReply>
} as const satisfies Command;
