import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_MULTIAGGR, { createTransformMRangeMultiArguments } from './MRANGE_MULTIAGGR';

export default {
  NOT_KEYED_COMMAND: MRANGE_MULTIAGGR.NOT_KEYED_COMMAND,
  IS_READ_ONLY: MRANGE_MULTIAGGR.IS_READ_ONLY,
  /**
   * Gets multi-aggregation samples for time series matching a specific filter within a time range (in reverse order)
   * @param parser - The command parser
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  parseCommand: createTransformMRangeMultiArguments('TS.MREVRANGE'),
  transformReply: MRANGE_MULTIAGGR.transformReply,
} as const satisfies Command;
