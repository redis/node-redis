import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformDoubleReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Returns the mean value from a t-digest sketch after trimming values at specified percentiles
   * @param parser - The command parser
   * @param key - The name of the t-digest sketch
   * @param lowCutPercentile - Lower percentile cutoff (between 0 and 100)
   * @param highCutPercentile - Higher percentile cutoff (between 0 and 100)
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    lowCutPercentile: number,
    highCutPercentile: number
  ) {
    parser.push('TDIGEST.TRIMMED_MEAN');
    parser.pushKey(key);
    parser.push(lowCutPercentile.toString(), highCutPercentile.toString());
  },
  transformReply: transformDoubleReply
} as const satisfies Command;
