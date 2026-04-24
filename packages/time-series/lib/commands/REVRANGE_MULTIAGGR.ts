import { Command } from '@redis/client/dist/lib/RESP/types';
import RANGE_MULTIAGGR, { transformRangeMultiArguments } from './RANGE_MULTIAGGR';

export default {
  IS_READ_ONLY: RANGE_MULTIAGGR.IS_READ_ONLY,
  /**
   * Gets multi-aggregation samples from a time series within a time range (in reverse order)
   * @param args - Arguments passed to the {@link transformRangeMultiArguments} function
   */
  parseCommand(...args: Parameters<typeof transformRangeMultiArguments>) {
    const parser = args[0];

    parser.push('TS.REVRANGE');
    transformRangeMultiArguments(...args);
  },
  transformReply: RANGE_MULTIAGGR.transformReply
} as const satisfies Command;
