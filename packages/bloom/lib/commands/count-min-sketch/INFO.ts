import { RedisArgument, TuplesToMapReply, BlobStringReply, NumberReply, Resp2Reply, Command } from '@redis/client/dist/lib/RESP/types';

export type BfInfoReply = TuplesToMapReply<[
  [BlobStringReply<'width'>, NumberReply],
  [BlobStringReply<'depth'>, NumberReply],
  [BlobStringReply<'count'>, NumberReply]
]>;
 
export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['CMS.INFO', key];
  },
  transformReply: {
    2: (reply: Resp2Reply<BfInfoReply>) => ({
      width: reply[1],
      depth: reply[3],
      count: reply[5]
    }),
    3: undefined as unknown as () => BfInfoReply
  }
} as const satisfies Command;
