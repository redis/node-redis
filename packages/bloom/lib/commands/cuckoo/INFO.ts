import { RedisArgument, Command, NumberReply, TuplesToMapReply, UnwrapReply, Resp2Reply, SimpleStringReply } from '@redis/client/dist/lib/RESP/types';

export type CfInfoReplyMap = TuplesToMapReply<[
  [SimpleStringReply<'Size'>, NumberReply],
  [SimpleStringReply<'Number of buckets'>, NumberReply],
  [SimpleStringReply<'Number of filters'>, NumberReply],
  [SimpleStringReply<'Number of items inserted'>, NumberReply],
  [SimpleStringReply<'Number of items deleted'>, NumberReply],
  [SimpleStringReply<'Bucket size'>, NumberReply],
  [SimpleStringReply<'Expansion rate'>, NumberReply],
  [SimpleStringReply<'Max iterations'>, NumberReply]
]>;

export interface CfInfoReply {
  size: NumberReply;
  numberOfBuckets: NumberReply;
  numberOfFilters: NumberReply;
  numberOfInsertedItems: NumberReply;
  numberOfDeletedItems: NumberReply;
  bucketSize: NumberReply;
  expansionRate: NumberReply;
  maxIteration: NumberReply;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['CF.INFO', key];
  },
 
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<CfInfoReplyMap>>): CfInfoReply => {
      return {
        size: reply[1],
        numberOfBuckets: reply[3],
        numberOfFilters: reply[5],
        numberOfInsertedItems: reply[7],
        numberOfDeletedItems: reply[9],
        bucketSize: reply[11],
        expansionRate: reply[13],
        maxIteration: reply[15]
      }
    },
    3: (reply: UnwrapReply<CfInfoReplyMap>): CfInfoReply => {
      if (reply instanceof Map) {
        throw new Error("BF.INFO shouldn't return a map type in resp3 anymore");
/*
        return {
          size: reply.get("Size" as unknown as BlobStringReply<"Size">)!,
          numberOfBuckets: reply.get('Number of buckets' as unknown as BlobStringReply<'Number of buckets'>)!,
          numberOfFilters: reply.get('Number of filters' as unknown as BlobStringReply<"Number of filters">)!,
          numberOfInsertedItems: reply.get('Number of items inserted' as unknown as BlobStringReply<'Number of items inserted'>)!,
          numberOfDeletedItems: reply.get('Number of items deleted' as unknown as BlobStringReply<'Number of items deleted'>)!,
          bucketSize: reply.get('Bucket size' as unknown as BlobStringReply<'Bucket size'>)!,
          expansionRate: reply.get('Expansion rate' as unknown as BlobStringReply<'Expansion rate'>)!,
          maxIteration: reply.get('Max iterations' as unknown as BlobStringReply<'Max iterations'>)!
        }
*/
      } else if (reply instanceof Array) {
        throw new Error("BF.INFO shouldn't return a array type in resp3 anymore");
/*
        return {
          size: reply[1],
          numberOfBuckets: reply[3],
          numberOfFilters: reply[5],
          numberOfInsertedItems: reply[7],
          numberOfDeletedItems: reply[9],
          bucketSize: reply[11],
          expansionRate: reply[13],
          maxIteration: reply[15]
        }
*/
      } else {
        return {
          size: reply['Size'],
          numberOfBuckets: reply['Number of buckets'],
          numberOfFilters: reply['Number of filters'],
          numberOfInsertedItems: reply['Number of items inserted'],
          numberOfDeletedItems: reply['Number of items deleted'],
          bucketSize: reply['Bucket size'],
          expansionRate: reply['Expansion rate'],
          maxIteration: reply['Max iterations']
        }
      }
    }
  },
  ignoreTypeMapping: true
} as const satisfies Command;
