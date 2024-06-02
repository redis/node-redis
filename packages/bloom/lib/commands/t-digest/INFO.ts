import { RedisArgument, Command, BlobStringReply, NumberReply, TuplesToMapReply, UnwrapReply, Resp2Reply } from '@redis/client/dist/lib/RESP/types';

export type TdInfoReplyMap = TuplesToMapReply<[
  [BlobStringReply<'Compression'>, NumberReply],
  [BlobStringReply<'Capacity'>, NumberReply],
  [BlobStringReply<'Merged nodes'>, NumberReply],
  [BlobStringReply<'Unmerged nodes'>, NumberReply],
  [BlobStringReply<'Merged weight'>, NumberReply],
  [BlobStringReply<'Unmerged weight'>, NumberReply],
  [BlobStringReply<'Observations'>, NumberReply],
  [BlobStringReply<'Total compressions'>, NumberReply],
  [BlobStringReply<'Memory usage'>, NumberReply]
]>;

export interface TdInfoReply {
  compression?: NumberReply;
  capacity?: NumberReply;
  mergedNodes?: NumberReply;
  unmergedNodes?: NumberReply;
  mergedWeight?: NumberReply;
  unmergedWeight?: NumberReply;
  observations?: NumberReply,
  totalCompression?: NumberReply;
  memoryUsage?: NumberReply
}

/*
const keyMap = {
  'Compression': { member: 'compression', index: 1 },
  'Capacity': { member: 'capacity', index: 3 },
  'Merged nodes': { member: 'mergedNodes', index: 5 },
  'Unmerged nodes': { member: 'unmergedNodes', index: 7 },
  'Merged weight': { member: 'mergedWeight', index: 9 },
  'Unmerged weight': { member: 'unmergedWeight', index: 11 },
  'Observations': { member: 'observations', index: 13 },
  'Total compressions': { member: 'totalCompression': index: 15 },
  'Memory usage': { member: 'memoryUsage', index: 17 }
}
*/

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['TDIGEST.INFO', key];
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<TdInfoReplyMap>>): TdInfoReply => {
      return {
        compression: reply[1],
        capacity: reply[3],
        mergedNodes: reply[5],
        unmergedNodes: reply[7],
        mergedWeight: reply[9],
        unmergedWeight: reply[11],
        observations: reply[13],
        totalCompression: reply[15],
        memoryUsage: reply[17]
      };
    },
    3: (reply: UnwrapReply<TdInfoReplyMap>): TdInfoReply => {
      if (reply instanceof Map) {
        throw new Error("BF.INFO shouldn't return a map type in resp3 anymore");
/*
        return {
          compression: reply.get('Compression' as unknown as BlobStringReply<any>),
          capacity: reply.get('Capacity' as unknown as BlobStringReply<any>),
          mergedNodes: reply.get('Merged nodes' as unknown as BlobStringReply<any>),
          unmergedNodes: reply.get('Unmerged nodes' as unknown as BlobStringReply<any>),
          mergedWeight: reply.get('Merged weight' as unknown as BlobStringReply<any>),
          unmergedWeight: reply.get('Unmerged weight' as unknown as BlobStringReply<any>),
          observations: reply.get('Observations' as unknown as BlobStringReply<any>),
          totalCompression: reply.get('Total compressions' as unknown as BlobStringReply<any>),
          memoryUsage: reply.get('Memory usage' as unknown as BlobStringReply<any>)
        };
*/
      } else if (reply instanceof Array) {
        throw new Error("BF.INFO shouldn't return a array type in resp3 anymore");
/*
        return {
          compression: reply[1],
          capacity: reply[3],
          mergedNodes: reply[5],
          unmergedNodes: reply[7],
          mergedWeight: reply[9],
          unmergedWeight: reply[11],
          observations: reply[13],
          totalCompression: reply[15],
          memoryUsage: reply[17]
        };
*/
      } else {
        return {
          compression: reply['Compression'],
          capacity: reply['Capacity'],
          mergedNodes: reply['Merged nodes'],
          unmergedNodes: reply['Unmerged nodes'],
          mergedWeight: reply['Merged weight'],
          unmergedWeight: reply['Unmerged weight'],
          observations: reply['Observations'],
          totalCompression: reply['Total compressions'],
          memoryUsage: reply['Memory usage']
        };
      }
    }
  },
  ignoreTypeMapping: true
} as const satisfies Command;
