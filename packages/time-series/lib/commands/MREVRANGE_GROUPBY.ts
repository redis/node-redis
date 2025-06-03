import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_GROUPBY, { createTransformMRangeGroupByArguments } from './MRANGE_GROUPBY';

export default {
  IS_READ_ONLY: MRANGE_GROUPBY.IS_READ_ONLY,
  /**
   * Gets samples for time series matching a filter within a time range with grouping (in reverse order)
   * @param parser - The command parser
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param groupBy - Group by parameters
   * @param options - Optional parameters for the command
   */
  parseCommand: createTransformMRangeGroupByArguments('TS.MREVRANGE'),
  transformReply: MRANGE_GROUPBY.transformReply,
} as const satisfies Command;
