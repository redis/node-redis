import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_SELECTED_LABELS_MULTIAGGR, { createTransformMRangeSelectedLabelsMultiArguments } from './MRANGE_SELECTED_LABELS_MULTIAGGR';

export default {
  IS_READ_ONLY: MRANGE_SELECTED_LABELS_MULTIAGGR.IS_READ_ONLY,
  /**
   * Gets multi-aggregation samples for time series matching a filter with selected labels (in reverse order)
   * @param parser - The command parser
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  parseCommand: createTransformMRangeSelectedLabelsMultiArguments('TS.MREVRANGE'),
  transformReply: MRANGE_SELECTED_LABELS_MULTIAGGR.transformReply,
} as const satisfies Command;
