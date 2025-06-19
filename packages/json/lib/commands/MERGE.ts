import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Merges a given JSON value into a JSON document.
   * Returns OK on success, or null if the key does not exist.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the JSON document
   * @param path - Path to merge into
   * @param value - JSON value to merge
   */
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument, value: RedisJSON) {
    parser.push('JSON.MERGE');
    parser.pushKey(key);
    parser.push(path, transformRedisJsonArgument(value));
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
