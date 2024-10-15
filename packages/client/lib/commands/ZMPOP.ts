import { RedisArgument, NullReply, TuplesReply, BlobStringReply, DoubleReply, ArrayReply, UnwrapReply, Resp2Reply, Command, TypeMapping } from '../RESP/types';
import { pushVariadicArgument, RedisVariadicArgument, SortedSetSide, transformSortedSetReply, transformDoubleReply } from './generic-transformers';

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
    2(reply: UnwrapReply<Resp2Reply<ZMPopRawReply>>, preserve?: any, typeMapping?: TypeMapping) {
      return reply === null ? null : {
        key: reply[0],
        members: (reply[1] as unknown as UnwrapReply<typeof reply[1]>).map(member => {
          const [value, score] = member as unknown as UnwrapReply<typeof member>;
          return {
            value,
            score: transformDoubleReply[2](score, preserve, typeMapping)
          };
        })
      };
    },
    3(reply: UnwrapReply<ZMPopRawReply>) {
      return reply === null ? null : {
        key: reply[0],
        members: transformSortedSetReply[3](reply[1])
      };
    }
  }
} as const satisfies Command;
