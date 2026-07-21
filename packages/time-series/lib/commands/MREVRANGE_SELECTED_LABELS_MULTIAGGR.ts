import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_SELECTED_LABELS_MULTIAGGR, { createTransformMRangeSelectedLabelsMultiArguments } from './MRANGE_SELECTED_LABELS_MULTIAGGR';

export default {
  parseCommand: createTransformMRangeSelectedLabelsMultiArguments('TS.MREVRANGE'),
  transformReply: MRANGE_SELECTED_LABELS_MULTIAGGR.transformReply,
} as const satisfies Command;
