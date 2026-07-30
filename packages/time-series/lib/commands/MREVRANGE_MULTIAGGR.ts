import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_MULTIAGGR, { createTransformMRangeMultiArguments } from './MRANGE_MULTIAGGR';

export default {
  parseCommand: createTransformMRangeMultiArguments('TS.MREVRANGE'),
  transformReply: MRANGE_MULTIAGGR.transformReply,
} as const satisfies Command;
