import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_WITHLABELS_MULTIAGGR, { createTransformMRangeWithLabelsMultiArguments } from './MRANGE_WITHLABELS_MULTIAGGR';

export default {
  parseCommand: createTransformMRangeWithLabelsMultiArguments('TS.MREVRANGE'),
  transformReply: MRANGE_WITHLABELS_MULTIAGGR.transformReply,
} as const satisfies Command;
