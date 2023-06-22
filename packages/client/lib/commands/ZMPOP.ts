import { NullReply, TuplesReply, BlobStringReply, DoubleReply, ArrayReply, Resp2Reply, Command } from '../RESP/types';
import { pushVariadicArgument, RedisVariadicArgument, SortedSetSide, transformSortedSetReply } from './generic-transformers';

export interface ZMPopOptions {
  COUNT?: number;
}

export type ZMPopRawReply = NullReply | TuplesReply<[
  key: BlobStringReply,
  members: ArrayReply<TuplesReply<[
    value: BlobStringReply,
    score: DoubleReply
  ]>>
]>;

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  transformArguments(
    keys: RedisVariadicArgument,
    side: SortedSetSide,
    options?: ZMPopOptions
  ) {
    const args = pushVariadicArgument(['ZMPOP'], keys);

    args.push(side);

    if (options?.COUNT) {
      args.push('COUNT', options.COUNT.toString());
    }

    return args;
  },
  transformReply: {
    2: (reply: Resp2Reply<ZMPopRawReply>) => {
      return reply === null ? null : {
        key: reply[0],
        members: reply[1].map(([value, score]) => ({
          value,
          score: Number(score)
        }))
      };
    },
    3: (reply: ZMPopRawReply) => {
      return reply === null ? null : {
        key: reply[0],
        members: transformSortedSetReply[3](reply[1])
      };
    },
  }
} as const satisfies Command;
