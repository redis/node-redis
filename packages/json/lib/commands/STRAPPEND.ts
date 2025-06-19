import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command, NullReply, NumberReply, ArrayReply } from '@redis/client/dist/lib/RESP/types';
import { transformRedisJsonArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export interface JsonStrAppendOptions {
  path?: RedisArgument;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Appends a string to a string value stored in a JSON document.
   * Returns new string length after append, or null if the path doesn't exist or value is not a string.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the JSON document
   * @param append - String to append
   * @param options - Optional parameters
   * @param options.path - Path to the string value
   */
  parseCommand(parser: CommandParser, key: RedisArgument, append: string, options?: JsonStrAppendOptions) {
    parser.push('JSON.STRAPPEND');
    parser.pushKey(key);

    if (options?.path !== undefined) {
      parser.push(options.path);
    }

    parser.push(transformRedisJsonArgument(append));
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NullReply | NumberReply>
} as const satisfies Command;
