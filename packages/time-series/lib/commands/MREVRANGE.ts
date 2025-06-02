import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE, { createTransformMRangeArguments } from './MRANGE';

export default {
  NOT_KEYED_COMMAND: MRANGE.NOT_KEYED_COMMAND,
  IS_READ_ONLY: MRANGE.IS_READ_ONLY,
  /**
   * Gets samples for time series matching a specific filter within a time range (in reverse order)
   * @param parser - The command parser
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  parseCommand: createTransformMRangeArguments('TS.MREVRANGE'),
  transformReply: MRANGE.transformReply,
} as const satisfies Command;
