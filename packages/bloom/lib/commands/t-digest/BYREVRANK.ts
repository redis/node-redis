import { Command } from '@redis/client/lib/RESP/types';
import BYRANK, { transformByRankArguments } from './BYRANK';

export default {
  IS_READ_ONLY: BYRANK.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof transformByRankArguments>) {
    args[0].push('TDIGEST.BYREVRANK');
    transformByRankArguments(...args);
  },
  transformReply: BYRANK.transformReply
} as const satisfies Command;
