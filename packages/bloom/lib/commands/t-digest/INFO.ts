import { RedisArgument, Command, NumberReply, TuplesToMapReply, UnwrapReply, Resp2Reply, SimpleStringReply } from '@redis/client/dist/lib/RESP/types';

export type TdInfoReplyMap = TuplesToMapReply<[
  [SimpleStringReply<'Compression'>, NumberReply],
  [SimpleStringReply<'Capacity'>, NumberReply],
  [SimpleStringReply<'Merged nodes'>, NumberReply],
  [SimpleStringReply<'Unmerged nodes'>, NumberReply],
  [SimpleStringReply<'Merged weight'>, NumberReply],
  [SimpleStringReply<'Unmerged weight'>, NumberReply],
  [SimpleStringReply<'Observations'>, NumberReply],
  [SimpleStringReply<'Total compressions'>, NumberReply],
  [SimpleStringReply<'Memory usage'>, NumberReply]
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
        throw new Error("TDIGEST.INFO shouldn't be used with type mapping to map or array");
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
        throw new Error("TDIGEST.INFO shouldn't be used with type mapping to map or array");
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
} as const satisfies Command;
