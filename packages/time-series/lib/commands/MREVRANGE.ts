import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE, { transformMRangeArguments } from './MRANGE';

export default {
  FIRST_KEY_INDEX: MRANGE.FIRST_KEY_INDEX,
  IS_READ_ONLY: MRANGE.IS_READ_ONLY,
  transformArguments: transformMRangeArguments.bind(undefined, 'TS.MREVRANGE'),
  transformReply: MRANGE.transformReply,
} as const satisfies Command;
