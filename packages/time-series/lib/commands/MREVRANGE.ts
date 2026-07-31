import { Command } from '@redis/client/dist/lib/RESP/types';
import MRANGE, { createTransformMRangeArguments } from './MRANGE';

export default {
  // Keyless read: replica-safe, but the metadata-derived isReplicaSafe
  // returns false for keyless commands, so opt in explicitly (restores the
  // pre-derivation master behavior).
  IS_READ_ONLY: true,
  parseCommand: createTransformMRangeArguments('TS.MREVRANGE'),
  transformReply: MRANGE.transformReply,
} as const satisfies Command;
