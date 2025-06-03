import { TuplesToMapReply, BlobStringReply, ArrayReply, TuplesReply, NumberReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';
import LCS_IDX, { LcsIdxRange } from './LCS_IDX';

export type LcsIdxWithMatchLenMatches = ArrayReply<
  TuplesReply<[
    key1: LcsIdxRange,
    key2: LcsIdxRange,
    len: NumberReply
  ]>
>;

export type LcsIdxWithMatchLenReply = TuplesToMapReply<[
  [BlobStringReply<'matches'>, LcsIdxWithMatchLenMatches],
  [BlobStringReply<'len'>, NumberReply]
]>;

export default {
  IS_READ_ONLY: LCS_IDX.IS_READ_ONLY,
  /**
   * Constructs the LCS command with IDX and WITHMATCHLEN options
   * 
   * @param args - The same parameters as LCS_IDX command
   * @see https://redis.io/commands/lcs/
   */
  parseCommand(...args: Parameters<typeof LCS_IDX.parseCommand>) {
    const parser = args[0];
    LCS_IDX.parseCommand(...args);
    parser.push('WITHMATCHLEN');
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<LcsIdxWithMatchLenReply>>) => ({
      matches: reply[1],
      len: reply[3]
    }),
    3: undefined as unknown as () => LcsIdxWithMatchLenReply
  }
} as const satisfies Command;
