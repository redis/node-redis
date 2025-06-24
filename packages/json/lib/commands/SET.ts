import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export interface JsonSetOptions {
  condition?: 'NX' | 'XX';
  /**
   * @deprecated Use `{ condition: 'NX' }` instead.
   */
  NX?: boolean;
  /**
   * @deprecated Use `{ condition: 'XX' }` instead.
   */
  XX?: boolean;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Sets a JSON value at a specific path in a JSON document.
   * Returns OK on success, or null if condition (NX/XX) is not met.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the JSON document
   * @param path - Path in the document to set
   * @param json - JSON value to set at the path
   * @param options - Optional parameters
   * @param options.condition - Set condition: NX (only if doesn't exist) or XX (only if exists)
   * @deprecated options.NX - Use options.condition instead
   * @deprecated options.XX - Use options.condition instead
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    path: RedisArgument,
    json: RedisJSON,
    options?: JsonSetOptions
  ) {
    parser.push('JSON.SET');
    parser.pushKey(key);
    parser.push(path, transformRedisJsonArgument(json));

    if (options?.condition) {
      parser.push(options?.condition);
    } else if (options?.NX) {
      parser.push('NX');
    } else if (options?.XX) {
      parser.push('XX');
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> | NullReply
} as const satisfies Command;
