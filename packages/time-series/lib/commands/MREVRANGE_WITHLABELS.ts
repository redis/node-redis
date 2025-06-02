import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_WITHLABELS, { createTransformMRangeWithLabelsArguments } from './MRANGE_WITHLABELS';

export default {
  NOT_KEYED_COMMAND: MRANGE_WITHLABELS.NOT_KEYED_COMMAND,
  IS_READ_ONLY: MRANGE_WITHLABELS.IS_READ_ONLY,
  /**
   * Gets samples for time series matching a filter with labels (in reverse order)
   * @param parser - The command parser
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  parseCommand: createTransformMRangeWithLabelsArguments('TS.MREVRANGE'),
  transformReply: MRANGE_WITHLABELS.transformReply,
} as const satisfies Command;
