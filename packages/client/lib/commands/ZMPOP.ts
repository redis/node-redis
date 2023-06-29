import { NullReply, TuplesReply, BlobStringReply, DoubleReply, ArrayReply, Resp2Reply, Command, RedisArgument } from '../RESP/types';
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

export function transformZMPopArguments(
  args: Array<RedisArgument>,
  keys: RedisVariadicArgument,
  side: SortedSetSide,
  options?: ZMPopOptions
) {
  args = pushVariadicArgument(args, keys);

  args.push(side);

  if (options?.COUNT) {
    args.push('COUNT', options.COUNT.toString());
  }

  return args;
}

export type ZMPopArguments = typeof transformZMPopArguments extends (_: any, ...args: infer T) => any ? T : never;

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  transformArguments(...args: ZMPopArguments) {
    return transformZMPopArguments(['ZMPOP'], ...args);
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
