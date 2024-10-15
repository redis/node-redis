import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_WITHLABELS_GROUPBY, { createMRangeWithLabelsGroupByTransformArguments } from './MRANGE_WITHLABELS_GROUPBY';

export default {
  FIRST_KEY_INDEX: MRANGE_WITHLABELS_GROUPBY.FIRST_KEY_INDEX,
  IS_READ_ONLY: MRANGE_WITHLABELS_GROUPBY.IS_READ_ONLY,
  transformArguments: createMRangeWithLabelsGroupByTransformArguments('TS.MREVRANGE'),
  transformReply: MRANGE_WITHLABELS_GROUPBY.transformReply,
} as const satisfies Command;
