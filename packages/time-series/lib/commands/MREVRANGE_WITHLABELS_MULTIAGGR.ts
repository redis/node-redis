import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_WITHLABELS_MULTIAGGR, { createTransformMRangeWithLabelsMultiArguments } from './MRANGE_WITHLABELS_MULTIAGGR';

export default {
  NOT_KEYED_COMMAND: MRANGE_WITHLABELS_MULTIAGGR.NOT_KEYED_COMMAND,
  IS_READ_ONLY: MRANGE_WITHLABELS_MULTIAGGR.IS_READ_ONLY,
  parseCommand: createTransformMRangeWithLabelsMultiArguments('TS.MREVRANGE'),
  transformReply: MRANGE_WITHLABELS_MULTIAGGR.transformReply,
} as const satisfies Command;
