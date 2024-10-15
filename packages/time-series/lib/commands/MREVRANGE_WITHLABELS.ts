import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_WITHLABELS, { createTransformMRangeWithLabelsArguments } from './MRANGE_WITHLABELS';

export default {
  FIRST_KEY_INDEX: MRANGE_WITHLABELS.FIRST_KEY_INDEX,
  IS_READ_ONLY: MRANGE_WITHLABELS.IS_READ_ONLY,
  transformArguments: createTransformMRangeWithLabelsArguments('TS.MREVRANGE'),
  transformReply: MRANGE_WITHLABELS.transformReply,
} as const satisfies Command;
