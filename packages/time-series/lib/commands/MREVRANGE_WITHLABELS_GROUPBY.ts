import { Command } from '@redis/client/lib/RESP/types';
import MRANGE_WITHLABELS_GROUPBY, { createMRangeWithLabelsGroupByTransformArguments } from './MRANGE_WITHLABELS_GROUPBY';

export default {
  IS_READ_ONLY: MRANGE_WITHLABELS_GROUPBY.IS_READ_ONLY,
  parseCommand: createMRangeWithLabelsGroupByTransformArguments('TS.MREVRANGE'),
  transformReply: MRANGE_WITHLABELS_GROUPBY.transformReply,
} as const satisfies Command;
