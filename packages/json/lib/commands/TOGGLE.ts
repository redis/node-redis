import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, NullReply, Command, } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Toggles a boolean value stored in a JSON document.
   * Returns 1 if value was toggled to true, 0 if toggled to false, or null if path doesn't exist.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the JSON document
   * @param path - Path to the boolean value
   */
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument) {
    parser.push('JSON.TOGGLE');
    parser.pushKey(key);
    parser.push(path);
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
