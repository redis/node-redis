import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Initialize a Count-Min Sketch using width and depth parameters
   * @param parser - The command parser
   * @param key - The name of the sketch
   * @param width - Number of counters in each array (must be a multiple of 2)
   * @param depth - Number of counter arrays (determines accuracy of estimates)
   */
  parseCommand(parser: CommandParser, key: RedisArgument, width: number, depth: number) {
    parser.push('CMS.INITBYDIM');
    parser.pushKey(key);
    parser.push(width.toString(), depth.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
