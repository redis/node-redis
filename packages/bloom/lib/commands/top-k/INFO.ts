import { RedisArgument, TuplesToMapReply, BlobStringReply, NumberReply, DoubleReply, Resp2Reply, Command } from '@redis/client/dist/lib/RESP/types';

export type TopKInfoReply = TuplesToMapReply<[
  [BlobStringReply<'k'>, NumberReply],
  [BlobStringReply<'width'>, NumberReply],
  [BlobStringReply<'depth'>, NumberReply],
  [BlobStringReply<'decay'>, DoubleReply]
]>;
 
export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['TOPK.INFO', key];
  },
  transformReply: {
    2: (reply: Resp2Reply<TopKInfoReply>) => ({
      k: reply[1],
      width: reply[3],
      depth: reply[5],
      decay: Number(reply[7])
    }),
    3: undefined as unknown as () => TopKInfoReply
  }
} as const satisfies Command;
