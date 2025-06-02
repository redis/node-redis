import { Command } from '@redis/client/dist/lib/RESP/types';
import RANGE, { transformRangeArguments } from './RANGE';

export default {
  IS_READ_ONLY: RANGE.IS_READ_ONLY,
  /**
   * Gets samples from a time series within a time range (in reverse order)
   * @param args - Arguments passed to the {@link transformRangeArguments} function
   */
  parseCommand(...args: Parameters<typeof transformRangeArguments>) {
    const parser = args[0];

    parser.push('TS.REVRANGE');
    transformRangeArguments(...args);
  },
  transformReply: RANGE.transformReply
} as const satisfies Command;
