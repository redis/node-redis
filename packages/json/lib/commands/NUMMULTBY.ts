import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import NUMINCRBY from './NUMINCRBY';

export default {
  IS_READ_ONLY: false,
  /**
   * Multiplies a numeric value stored in a JSON document by a given number.
   * Returns the value after multiplication, or null if the key/path doesn't exist or value is not numeric.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the JSON document
   * @param path - Path to the numeric value
   * @param by - Amount to multiply by
   */
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument, by: number) {
    parser.push('JSON.NUMMULTBY');
    parser.pushKey(key);
    parser.push(path, by.toString());
  },
  transformReply: NUMINCRBY.transformReply
} as const satisfies Command;
