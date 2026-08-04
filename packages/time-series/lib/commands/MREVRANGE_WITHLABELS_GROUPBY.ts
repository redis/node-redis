import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_WITHLABELS_GROUPBY, { createMRangeWithLabelsGroupByTransformArguments } from './MRANGE_WITHLABELS_GROUPBY';

export default {
  parseCommand: createMRangeWithLabelsGroupByTransformArguments('TS.MREVRANGE'),
  transformReply: MRANGE_WITHLABELS_GROUPBY.transformReply,
} as const satisfies Command;
