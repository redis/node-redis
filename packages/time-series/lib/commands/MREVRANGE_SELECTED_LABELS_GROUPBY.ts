import { Command } from '@redis/client/lib/RESP/types';
import MRANGE_SELECTED_LABELS_GROUPBY, { createMRangeSelectedLabelsGroupByTransformArguments } from './MRANGE_SELECTED_LABELS_GROUPBY';

export default {
  IS_READ_ONLY: MRANGE_SELECTED_LABELS_GROUPBY.IS_READ_ONLY,
  parseCommand: createMRangeSelectedLabelsGroupByTransformArguments('TS.MREVRANGE'),
  transformReply: MRANGE_SELECTED_LABELS_GROUPBY.transformReply,
} as const satisfies Command;
