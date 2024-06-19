import { RedisArgument, NullReply, TuplesReply, BlobStringReply, DoubleReply, ArrayReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
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
  command: RedisArgument,
  parser: CommandParser,
  keys: RedisVariadicArgument,
  side: SortedSetSide,
  options?: ZMPopOptions
) {
  parser.push(command);
  parser.pushKeysLength(keys);

  parser.push(side);

  if (options?.COUNT) {
    parser.pushVariadic(['COUNT', options.COUNT.toString()]);
  }
}

export type ZMPopArguments = Tail<Tail<Parameters<typeof parseZMPopArguments>>>;

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  parseCommand: parseZMPopArguments.bind(undefined, 'ZMPOP'),
  transformArguments(...args: ZMPopArguments) { return [] },
  transformReply: {
    2(reply: UnwrapReply<Resp2Reply<ZMPopRawReply>>) {
      return reply === null ? null : {
        key: reply[0],
        members: (reply[1] as unknown as UnwrapReply<typeof reply[1]>).map(member => {
          const [value, score] = member as unknown as UnwrapReply<typeof member>;
          return {
            value,
            score: transformDoubleReply[2](score)
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
