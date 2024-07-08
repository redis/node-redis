import { RedisArgument, TuplesToMapReply, BlobStringReply, ArrayReply, TuplesReply, NumberReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import LCS_IDX, { LcsIdxOptions, LcsIdxRange } from './LCS_IDX';

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
  FIRST_KEY_INDEX: LCS_IDX.FIRST_KEY_INDEX,
  IS_READ_ONLY: LCS_IDX.IS_READ_ONLY,
  parseCommand(
    parser: CommandParser,
    key1: RedisArgument,
    key2: RedisArgument,
    options?: LcsIdxOptions
  ) {
    LCS_IDX.parseCommand(parser, key1, key2);
    parser.push('WITHMATCHLEN');
  },
  transformArguments(
    key1: RedisArgument,
    key2: RedisArgument,
    options?: LcsIdxOptions
  ) { return [] },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<LcsIdxWithMatchLenReply>>) => ({
      matches: reply[1],
      len: reply[3]
    }),
    3: undefined as unknown as () => LcsIdxWithMatchLenReply
  }
} as const satisfies Command;
