import { Command } from '@redis/client/lib/RESP/types';
import MRANGE, { createTransformMRangeArguments } from './MRANGE';

export default {
  NOT_KEYED_COMMAND: MRANGE.NOT_KEYED_COMMAND,
  IS_READ_ONLY: MRANGE.IS_READ_ONLY,
  parseCommand: createTransformMRangeArguments('TS.MREVRANGE'),
  transformReply: MRANGE.transformReply,
} as const satisfies Command;
