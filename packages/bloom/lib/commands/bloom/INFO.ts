import { RedisArgument, Command, UnwrapReply, NullReply, NumberReply, TuplesToMapReply, Resp2Reply, SimpleStringReply, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import { transformInfoV2Reply } from '.';

export type BfInfoReplyMap = TuplesToMapReply<[
  [SimpleStringReply<'Capacity'>, NumberReply],
  [SimpleStringReply<'Size'>, NumberReply],
  [SimpleStringReply<'Number of filters'>, NumberReply],
  [SimpleStringReply<'Number of items inserted'>, NumberReply],
  [SimpleStringReply<'Expansion rate'>, NullReply | NumberReply] 
]>;

export interface BfInfoReply {
  capacity: NumberReply;
  size: NumberReply;
  numberOfFilters: NumberReply;
  numberOfInsertedItems: NumberReply;
  expansionRate: NullReply | NumberReply;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['BF.INFO', key];
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<BfInfoReplyMap>>, _, typeMapping?: TypeMapping): BfInfoReplyMap => {
      return transformInfoV2Reply<BfInfoReplyMap>(reply, typeMapping);
    },
    3: undefined as unknown as () => BfInfoReplyMap
  }
} as const satisfies Command;
