import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_GROUPBY, { createTransformMRangeGroupByArguments } from './MRANGE_GROUPBY';

export default {
  parseCommand: createTransformMRangeGroupByArguments('TS.MREVRANGE'),
  transformReply: MRANGE_GROUPBY.transformReply,
} as const satisfies Command;
