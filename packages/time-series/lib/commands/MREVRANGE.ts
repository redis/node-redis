import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE, { createTransformMRangeArguments } from './MRANGE';

export default {
  FIRST_KEY_INDEX: MRANGE.FIRST_KEY_INDEX,
  IS_READ_ONLY: MRANGE.IS_READ_ONLY,
  transformArguments: createTransformMRangeArguments('TS.MREVRANGE'),
  transformReply: MRANGE.transformReply,
} as const satisfies Command;
