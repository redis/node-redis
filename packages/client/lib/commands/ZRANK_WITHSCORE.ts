import { NullReply, TuplesReply, NumberReply, BlobStringReply, DoubleReply, UnwrapReply, Command } from '../RESP/types';
import ZRANK from './ZRANK';

export default {
  CACHEABLE: ZRANK.CACHEABLE,
  IS_READ_ONLY: ZRANK.IS_READ_ONLY,
  /**
   * Returns the rank of a member in the sorted set with its score.
   * @param args - Same parameters as the ZRANK command.
   */
  parseCommand(...args: Parameters<typeof ZRANK.parseCommand>) {
    const parser = args[0];

    ZRANK.parseCommand(...args);
    parser.push('WITHSCORE');
  },
  transformReply: {
    2: (reply: UnwrapReply<NullReply | TuplesReply<[NumberReply, BlobStringReply]>>) => {
      if (reply === null) return null;

      return {
        rank: reply[0],
        score: Number(reply[1])
      };
    },
    3: (reply: UnwrapReply<NullReply | TuplesReply<[BlobStringReply, DoubleReply]>>) => {
      if (reply === null) return null;

      return {
        rank: reply[0],
        score: reply[1]
      };
    }
  }
} as const satisfies Command;
