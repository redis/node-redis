import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['TDIGEST.INFO', key];
  },
  // TODO
  // type InfoRawReply = [
  //     'Compression',
  //     number,
  //     'Capacity',
  //     number,
  //     'Merged nodes',
  //     number,
  //     'Unmerged nodes',
  //     number,
  //     'Merged weight',
  //     string,
  //     'Unmerged weight',
  //     string,
  //     'Total compressions',
  //     number
  // ];

  // interface InfoReply {
  //     comperssion: number;
  //     capacity: number;
  //     mergedNodes: number;
  //     unmergedNodes: number;
  //     mergedWeight: number;
  //     unmergedWeight: number;
  //     totalCompression: number;
  // }

  // export function transformReply(reply: InfoRawReply): InfoReply {
  //     return {
  //         comperssion: reply[1],
  //         capacity: reply[3],
  //         mergedNodes: reply[5],
  //         unmergedNodes: reply[7],
  //         mergedWeight: Number(reply[9]),
  //         unmergedWeight: Number(reply[11]),
  //         totalCompression: reply[13]
  //     };
  // }
  transformReply: undefined as unknown as () => any
} as const satisfies Command;
