import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformDoubleArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Estimates the cumulative distribution function for values in a t-digest sketch
   * @param parser - The command parser
   * @param key - The name of the t-digest sketch
   * @param values - Array of values to get CDF estimates for
   */
  parseCommand(parser: CommandParser, key: RedisArgument, values: Array<number>) {
    parser.push('TDIGEST.CDF');
    parser.pushKey(key);

    for (const item of values) {
      parser.push(item.toString());
    }
  },
  transformReply: transformDoubleArrayReply
} as const satisfies Command;
