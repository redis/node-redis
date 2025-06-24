import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export interface JsonMSetItem {
  key: RedisArgument;
  path: RedisArgument;
  value: RedisJSON;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Sets multiple JSON values in multiple documents.
   * Returns OK on success.
   * 
   * @param parser - The Redis command parser
   * @param items - Array of objects containing key, path, and value to set
   * @param items[].key - The key containing the JSON document
   * @param items[].path - Path in the document to set
   * @param items[].value - JSON value to set at the path
   */
  parseCommand(parser: CommandParser, items: Array<JsonMSetItem>) {
    parser.push('JSON.MSET');

    for (let i = 0; i < items.length; i++) {
      parser.pushKey(items[i].key);
      parser.push(items[i].path, transformRedisJsonArgument(items[i].value));
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
