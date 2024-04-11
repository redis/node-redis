import { Command } from '@redis/client/dist/lib/RESP/types';
import RANGE, { transformRangeArguments } from './RANGE';

export default {
  FIRST_KEY_INDEX: RANGE.FIRST_KEY_INDEX,
  IS_READ_ONLY: RANGE.IS_READ_ONLY,
  transformArguments: transformRangeArguments.bind(undefined, 'TS.REVRANGE'),
  transformReply: RANGE.transformReply
} as const satisfies Command;
