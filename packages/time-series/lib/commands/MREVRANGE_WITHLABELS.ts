import { Command } from '@redis/client/lib/RESP/types';
import MRANGE_WITHLABELS, { createTransformMRangeWithLabelsArguments } from './MRANGE_WITHLABELS';

export default {
  NOT_KEYED_COMMAND: MRANGE_WITHLABELS.NOT_KEYED_COMMAND,
  IS_READ_ONLY: MRANGE_WITHLABELS.IS_READ_ONLY,
  parseCommand: createTransformMRangeWithLabelsArguments('TS.MREVRANGE'),
  transformReply: MRANGE_WITHLABELS.transformReply,
} as const satisfies Command;
