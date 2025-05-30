import { CommandParser } from '../client/parser';
import { NullReply, TuplesReply, BlobStringReply, DoubleReply, ArrayReply, UnwrapReply, Resp2Reply, Command, TypeMapping } from '../RESP/types';
import { RedisVariadicArgument, SortedSetSide, transformSortedSetReply, transformDoubleReply, Tail } from './generic-transformers';

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

export function parseZMPopArguments(
  parser: CommandParser,
  keys: RedisVariadicArgument,
  side: SortedSetSide,
  options?: ZMPopOptions
) {
  parser.pushKeysLength(keys);

  parser.push(side);

  if (options?.COUNT) {
    parser.push('COUNT', options.COUNT.toString());
  }
}

export type ZMPopArguments = Tail<Parameters<typeof parseZMPopArguments>>;

export default {
  IS_READ_ONLY: false,
  /**
   * Removes and returns up to count members with the highest/lowest scores from the first non-empty sorted set.
   * @param parser - The Redis command parser.
   * @param keys - Keys of the sorted sets to pop from.
   * @param side - Side to pop from (MIN or MAX).
   * @param options - Optional parameters including COUNT.
   */
  parseCommand(
    parser: CommandParser,
    keys: RedisVariadicArgument,
    side: SortedSetSide,
    options?: ZMPopOptions
  ) {
    parser.push('ZMPOP');
    parseZMPopArguments(parser, keys, side, options)
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
