import { Command } from '@redis/client/lib/RESP/types';
import MRANGE_GROUPBY, { createTransformMRangeGroupByArguments } from './MRANGE_GROUPBY';

export default {
  IS_READ_ONLY: MRANGE_GROUPBY.IS_READ_ONLY,
  parseCommand: createTransformMRangeGroupByArguments('TS.MREVRANGE'),
  transformReply: MRANGE_GROUPBY.transformReply,
} as const satisfies Command;
