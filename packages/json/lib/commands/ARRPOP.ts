import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, NullReply, BlobStringReply, Command, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import { isArrayReply, transformRedisJsonNullReply } from '@redis/client/dist/lib/commands/generic-transformers';

export interface RedisArrPopOptions {
  path: RedisArgument;
  index?: number;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Removes and returns an element from an array in a JSON document.
   * Returns null if the path does not exist or the value is not an array.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the array
   * @param options - Optional parameters
   * @param options.path - Path to the array in the JSON document
   * @param options.index - Optional index to pop from. Default is -1 (last element)
   */
  parseCommand(parser: CommandParser, key: RedisArgument, options?: RedisArrPopOptions) {
    parser.push('JSON.ARRPOP');
    parser.pushKey(key);

    if (options) {
      parser.push(options.path);

      if (options.index !== undefined) {
        parser.push(options.index.toString());
      }
    }
  },
  transformReply(reply: NullReply | BlobStringReply | ArrayReply<NullReply | BlobStringReply>) {
    return isArrayReply(reply) ?
      (reply as unknown as UnwrapReply<typeof reply>).map(item => transformRedisJsonNullReply(item)) :
      transformRedisJsonNullReply(reply);
  }
} as const satisfies Command;

