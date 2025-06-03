import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Adds one or more observations to a t-digest sketch
   * @param parser - The command parser
   * @param key - The name of the t-digest sketch
   * @param values - Array of numeric values to add to the sketch
   */
  parseCommand(parser: CommandParser, key: RedisArgument, values: Array<number>) {
    parser.push('TDIGEST.ADD');
    parser.pushKey(key);

    for (const value of values) {
      parser.push(value.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
