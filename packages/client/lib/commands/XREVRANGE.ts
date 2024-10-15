import { Command } from '../RESP/types';
import XRANGE, { transformXRangeArguments } from './XRANGE';

export interface XRevRangeOptions {
  COUNT?: number;
}

export default {
  FIRST_KEY_INDEX: XRANGE.FIRST_KEY_INDEX,
  IS_READ_ONLY: XRANGE.IS_READ_ONLY,
  transformArguments: transformXRangeArguments.bind(undefined, 'XREVRANGE'),
  transformReply: XRANGE.transformReply
} as const satisfies Command;
