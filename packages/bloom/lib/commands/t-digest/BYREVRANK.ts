import { Command } from '@redis/client/dist/lib/RESP/types';
import BYRANK, { transformByRankArguments } from './BYRANK';

/**
 * Returns value estimates for one or more ranks in a t-digest sketch, starting from highest rank
 * @param parser - The command parser
 * @param key - The name of the t-digest sketch
 * @param ranks - Array of ranks to get value estimates for (descending order)
 */
export default {
  IS_READ_ONLY: BYRANK.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof transformByRankArguments>) {
    args[0].push('TDIGEST.BYREVRANK');
    transformByRankArguments(...args);
  },
  transformReply: BYRANK.transformReply
} as const satisfies Command;
