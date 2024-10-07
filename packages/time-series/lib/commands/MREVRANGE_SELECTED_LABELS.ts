import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_SELECTED_LABELS, { createTransformMRangeSelectedLabelsArguments } from './MRANGE_SELECTED_LABELS';

export default {
  FIRST_KEY_INDEX: MRANGE_SELECTED_LABELS.FIRST_KEY_INDEX,
  IS_READ_ONLY: MRANGE_SELECTED_LABELS.IS_READ_ONLY,
  transformArguments: createTransformMRangeSelectedLabelsArguments('TS.MREVRANGE'),
  transformReply: MRANGE_SELECTED_LABELS.transformReply,
} as const satisfies Command;
