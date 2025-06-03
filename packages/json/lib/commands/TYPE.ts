import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { NullReply, BlobStringReply, ArrayReply, Command, RedisArgument, UnwrapReply } from '@redis/client/dist/lib/RESP/types';

export interface JsonTypeOptions {
  path?: RedisArgument;
}

export default {
  IS_READ_ONLY: true,
  /**
   * Returns the type of JSON value at a specific path in a JSON document.
   * Returns the type as a string, array of types for multiple paths, or null if path doesn't exist.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to examine
   */
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonTypeOptions) {
    parser.push('JSON.TYPE');
    parser.pushKey(key);

    if (options?.path) {
      parser.push(options.path);
    }
  },
  transformReply: {
    2: undefined as unknown as () => NullReply | BlobStringReply | ArrayReply<BlobStringReply | NullReply>,
    // TODO: RESP3 wraps the response in another array, but only returns 1 
    3: (reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply | ArrayReply<BlobStringReply | NullReply>>>) => {
      return reply[0];
    }
  },
} as const satisfies Command;
