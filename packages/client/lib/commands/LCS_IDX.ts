import { RedisArgument, TuplesToMapReply, BlobStringReply, ArrayReply, NumberReply, UnwrapReply, Resp2Reply, Command, TuplesReply } from '../RESP/types';
import { CommandParser } from '../client/parser';
import LCS from './LCS';

export interface LcsIdxOptions {
  MINMATCHLEN?: number;
}

export type LcsIdxRange = TuplesReply<[
  start: NumberReply,
  end: NumberReply
]>;

export type LcsIdxMatches = ArrayReply<
  TuplesReply<[
    key1: LcsIdxRange,
    key2: LcsIdxRange
  ]>
>;

export type LcsIdxReply = TuplesToMapReply<[
  [BlobStringReply<'matches'>, LcsIdxMatches],
  [BlobStringReply<'len'>, NumberReply]
]>;

export default {
  FIRST_KEY_INDEX: LCS.FIRST_KEY_INDEX,
  IS_READ_ONLY: LCS.IS_READ_ONLY,
  parseCommand(
    parser: CommandParser,
    key1: RedisArgument,
    key2: RedisArgument,
    options?: LcsIdxOptions
  ) {
    LCS.parseCommand(parser, key1, key2);

    parser.push('IDX');

    if (options?.MINMATCHLEN) {
      parser.pushVariadic(['MINMATCHLEN', options.MINMATCHLEN.toString()]);
    }
  },
  transformArguments(
    key1: RedisArgument,
    key2: RedisArgument,
    options?: LcsIdxOptions
  ) { return [] },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<LcsIdxReply>>) => ({
      matches: reply[1],
      len: reply[3]
    }),
    3: undefined as unknown as () => LcsIdxReply
  }
} as const satisfies Command;
