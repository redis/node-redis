import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_WITHLABELS, { createTransformMRangeWithLabelsArguments } from './MRANGE_WITHLABELS';

export default {
  parseCommand: createTransformMRangeWithLabelsArguments('TS.MREVRANGE'),
  transformReply: MRANGE_WITHLABELS.transformReply,
} as const satisfies Command;
