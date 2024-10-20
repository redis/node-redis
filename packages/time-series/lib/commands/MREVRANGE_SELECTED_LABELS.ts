import { Command } from '@redis/client/lib/RESP/types';
import MRANGE_SELECTED_LABELS, { createTransformMRangeSelectedLabelsArguments } from './MRANGE_SELECTED_LABELS';

export default {
  IS_READ_ONLY: MRANGE_SELECTED_LABELS.IS_READ_ONLY,
  parseCommand: createTransformMRangeSelectedLabelsArguments('TS.MREVRANGE'),
  transformReply: MRANGE_SELECTED_LABELS.transformReply,
} as const satisfies Command;
