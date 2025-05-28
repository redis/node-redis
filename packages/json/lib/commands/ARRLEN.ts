import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface JsonArrLenOptions {
  path?: RedisArgument;
}

export default {
  IS_READ_ONLY: true,
  /**
   * Returns the length of an array in a JSON document.
   * Returns null if the path does not exist or the value is not an array.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the array
   * @param options - Optional parameters
   * @param options.path - Path to the array in the JSON document
   */
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonArrLenOptions) {
    parser.push('JSON.ARRLEN');
    parser.pushKey(key);
    if (options?.path !== undefined) {
      parser.push(options.path);
    }
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
