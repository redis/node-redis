import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE, { createTransformMRangeArguments } from './MRANGE';

export default {
  parseCommand: createTransformMRangeArguments('TS.MREVRANGE'),
  transformReply: MRANGE.transformReply,
} as const satisfies Command;
