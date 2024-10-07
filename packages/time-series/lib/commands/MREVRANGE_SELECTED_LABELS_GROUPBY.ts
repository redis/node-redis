import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_SELECTED_LABELS_GROUPBY, { createMRangeSelectedLabelsGroupByTransformArguments } from './MRANGE_SELECTED_LABELS_GROUPBY';

export default {
  FIRST_KEY_INDEX: MRANGE_SELECTED_LABELS_GROUPBY.FIRST_KEY_INDEX,
  IS_READ_ONLY: MRANGE_SELECTED_LABELS_GROUPBY.IS_READ_ONLY,
  transformArguments: createMRangeSelectedLabelsGroupByTransformArguments('TS.MREVRANGE'),
  transformReply: MRANGE_SELECTED_LABELS_GROUPBY.transformReply,
} as const satisfies Command;
