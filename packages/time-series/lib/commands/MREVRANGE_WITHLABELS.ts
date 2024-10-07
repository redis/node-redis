import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_WITHLABELS, { transformMRangeWithLabelsArguments } from './MRANGE_WITHLABELS';

export default {
  FIRST_KEY_INDEX: MRANGE_WITHLABELS.FIRST_KEY_INDEX,
  IS_READ_ONLY: MRANGE_WITHLABELS.IS_READ_ONLY,
  transformArguments: transformMRangeWithLabelsArguments.bind(undefined, 'TS.MREVRANGE'),
  transformReply: MRANGE_WITHLABELS.transformReply,
} as const satisfies Command;
