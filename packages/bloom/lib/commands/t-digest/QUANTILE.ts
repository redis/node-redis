import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformDoubleArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Returns value estimates at requested quantiles from a t-digest sketch
   * @param parser - The command parser
   * @param key - The name of the t-digest sketch
   * @param quantiles - Array of quantiles (between 0 and 1) to get value estimates for
   */
  parseCommand(parser: CommandParser, key: RedisArgument, quantiles: Array<number>) {
    parser.push('TDIGEST.QUANTILE');
    parser.pushKey(key);

    for (const quantile of quantiles) {
      parser.push(quantile.toString());
    }
  },
  transformReply: transformDoubleArrayReply
} as const satisfies Command;
