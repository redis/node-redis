import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, transformRedisJsonNullReply } from '@redis/client/dist/lib/commands/generic-transformers';

export interface JsonGetOptions {
  path?: RedisVariadicArgument;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Gets values from a JSON document.
   * Returns the value at the specified path, or null if the key or path does not exist.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path(s) to the value(s) to retrieve
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    options?: JsonGetOptions
  ) {
    parser.push('JSON.GET');
    parser.pushKey(key);
    if (options?.path !== undefined) {
      parser.pushVariadic(options.path);
    }
  },
  transformReply: transformRedisJsonNullReply
} as const satisfies Command;