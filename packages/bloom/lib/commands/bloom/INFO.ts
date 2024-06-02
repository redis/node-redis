import { RedisArgument, Command, UnwrapReply, NullReply, BlobStringReply, NumberReply, TuplesToMapReply, Resp2Reply } from '@redis/client/dist/lib/RESP/types';

export type BfInfoReplyMap = TuplesToMapReply<[
  [BlobStringReply<'Capacity'>, NumberReply],
  [BlobStringReply<'Size'>, NumberReply],
  [BlobStringReply<'Number of filters'>, NumberReply],
  [BlobStringReply<'Number of items inserted'>, NumberReply],
  [BlobStringReply<'Expansion rate'>, NullReply | NumberReply] 
]>;

export interface BfInfoReply {
  capacity?: NumberReply;
  size?: NumberReply;
  numberOfFilters?: NumberReply;
  numberOfInsertedItems?: NumberReply;
  expansionRate?: NullReply | NumberReply;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['BF.INFO', key];
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<BfInfoReplyMap>>): BfInfoReply => {
      return {
        capacity: reply[1],
        size: reply[3],
        numberOfFilters: reply[5],
        numberOfInsertedItems: reply[7],
        expansionRate: reply[9]
      }
    },
    3: (reply: UnwrapReply<BfInfoReplyMap>) => {
      if (reply instanceof Map) {
        throw new Error("BF.INFO shouldn't return a map type in resp3 anymore");
/*
        return {
          capacity: reply.get("Capacity" as unknown as BlobStringReply<'Capacity'>),
          size: reply.get("Size" as unknown as BlobStringReply<"Size">),
          numberOfFilters: reply.get("Number of filters" as unknown as BlobStringReply<"Number of filters">),
          numberOfInsertedItems: reply.get('Number of items inserted' as unknown as BlobStringReply<'Number of items inserted'>),
          expansionRate: reply.get('Expansion rate' as unknown as BlobStringReply<'Expansion rate'>),
        }
*/
      } else if (reply instanceof Array) {
        throw new Error("BF.INFO shouldn't return a array type in resp3 anymore");
/*
        return {
          capacity: reply[1],
          size: reply[3],
          numberOfFilters: reply[5],
          numberOfInsertedItems: reply[7],
          expansionRate: reply[9]
        }
*/
      } else {
        return {
          capacity: reply["Capacity"],
          size: reply["Size"],
          numberOfFilters: reply["Number of filters"],
          numberOfInsertedItems: reply["Number of items inserted"],
          expansionRate: reply["Expansion rate"]
        }
      }
    },
  },
  ignoreTypeMapping: true
} as const satisfies Command;
