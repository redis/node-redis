import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, ArrayReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export interface JsonArrIndexOptions {
  range?: {
    start: number;
    stop?: number;
  };
}

export default {
  IS_READ_ONLY: true,
  /**
   * Returns the index of the first occurrence of a value in a JSON array.
   * If the specified value is not found, it returns -1, or null if the path does not exist.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the array
   * @param path - Path to the array in the JSON document
   * @param json - The value to search for
   * @param options - Optional range parameters for the search
   * @param options.range.start - Starting index for the search
   * @param options.range.stop - Optional ending index for the search
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    path: RedisArgument,
    json: RedisJSON,
    options?: JsonArrIndexOptions
  ) {
    parser.push('JSON.ARRINDEX');
    parser.pushKey(key);
    parser.push(path, transformRedisJsonArgument(json));

    if (options?.range) {
      parser.push(options.range.start.toString());

      if (options.range.stop !== undefined) {
        parser.push(options.range.stop.toString());
      }
    }
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
