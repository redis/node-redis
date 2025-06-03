import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Trims an array in a JSON document to include only elements within the specified range.
   * Returns the new array length after trimming, or null if the path does not exist.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the array
   * @param path - Path to the array in the JSON document
   * @param start - Starting index (inclusive)
   * @param stop - Ending index (inclusive)
   */
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument, start: number, stop: number) {
    parser.push('JSON.ARRTRIM');
    parser.pushKey(key);
    parser.push(path, start.toString(), stop.toString());
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
