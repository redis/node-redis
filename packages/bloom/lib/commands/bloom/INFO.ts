import { RedisArgument, Command, UnwrapReply, NullReply, NumberReply, TuplesToMapReply, Resp2Reply, SimpleStringReply } from '@redis/client/dist/lib/RESP/types';

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
    2(reply: UnwrapReply<Resp2Reply<BfInfoReplyMap>>): BfInfoReply {
      return {
        capacity: reply[1],
        size: reply[3],
        numberOfFilters: reply[5],
        numberOfInsertedItems: reply[7],
        expansionRate: reply[9]
      };
    },
    3(reply: UnwrapReply<BfInfoReplyMap>): BfInfoReply {
      if (reply instanceof Map) {
        return {
          capacity: reply.get('Capacity') as NumberReply,
          size: reply.get('Size') as NumberReply,
          numberOfFilters: reply.get('Number of filters') as NumberReply,
          numberOfInsertedItems: reply.get('Number of items inserted') as NumberReply,
          expansionRate: reply.get('Expansion rate') as NullReply | NumberReply
        }
      } else if (reply instanceof Array) {
        return {
          capacity: reply[1],
          size: reply[3],
          numberOfFilters: reply[5],
          numberOfInsertedItems: reply[7],
          expansionRate: reply[9]
        }
      } else {
        return {
          capacity: reply["Capacity"],
          size: reply["Size"],
          numberOfFilters: reply["Number of filters"],
          numberOfInsertedItems: reply["Number of items inserted"],
          expansionRate: reply["Expansion rate"]
        };
      }
    }
  }
} as const satisfies Command;
