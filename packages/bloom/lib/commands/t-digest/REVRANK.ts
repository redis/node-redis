import { Command } from '@redis/client/lib/RESP/types';
import RANK, { transformRankArguments } from './RANK';

export default {
  IS_READ_ONLY: RANK.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof transformRankArguments>) {
    args[0].push('TDIGEST.REVRANK');
    transformRankArguments(...args);
  },
  transformReply: RANK.transformReply
} as const satisfies Command;
