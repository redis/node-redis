import { Command } from '@redis/client/dist/lib/RESP/types';
import RANK, { transformRankArguments } from './RANK';

/**
 * Returns the reverse rank of one or more values in a t-digest sketch (number of values that are higher than each value)
 * @param parser - The command parser
 * @param key - The name of the t-digest sketch
 * @param values - Array of values to get reverse ranks for
 */
export default {
  IS_READ_ONLY: RANK.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof transformRankArguments>) {
    args[0].push('TDIGEST.REVRANK');
    transformRankArguments(...args);
  },
  transformReply: RANK.transformReply
} as const satisfies Command;
