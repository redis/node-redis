import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_SELECTED_LABELS_GROUPBY, { createMRangeSelectedLabelsGroupByTransformArguments } from './MRANGE_SELECTED_LABELS_GROUPBY';

export default {
  parseCommand: createMRangeSelectedLabelsGroupByTransformArguments('TS.MREVRANGE'),
  transformReply: MRANGE_SELECTED_LABELS_GROUPBY.transformReply,
} as const satisfies Command;
