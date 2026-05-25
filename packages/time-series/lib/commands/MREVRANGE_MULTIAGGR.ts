import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE_MULTIAGGR, { createTransformMRangeMultiArguments } from './MRANGE_MULTIAGGR';

export default {
  NOT_KEYED_COMMAND: MRANGE_MULTIAGGR.NOT_KEYED_COMMAND,
  IS_READ_ONLY: MRANGE_MULTIAGGR.IS_READ_ONLY,
  parseCommand: createTransformMRangeMultiArguments('TS.MREVRANGE'),
  transformReply: MRANGE_MULTIAGGR.transformReply,
} as const satisfies Command;
