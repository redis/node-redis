import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_GROUPBY, { createTransformMRangeGroupByArguments } from './MRANGE_GROUPBY';

export default {
  FIRST_KEY_INDEX: MRANGE_GROUPBY.FIRST_KEY_INDEX,
  IS_READ_ONLY: MRANGE_GROUPBY.IS_READ_ONLY,
  transformArguments: createTransformMRangeGroupByArguments('TS.MREVRANGE'),
  transformReply: MRANGE_GROUPBY.transformReply,
} as const satisfies Command;
