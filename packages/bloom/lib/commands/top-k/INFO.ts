import { RedisArgument, TuplesToMapReply, BlobStringReply, NumberReply, DoubleReply, UnwrapReply, Resp2Reply, Command } from '@redis/client/dist/lib/RESP/types';

export type TopKInfoReplyMap = TuplesToMapReply<[
  [BlobStringReply<'k'>, NumberReply],
  [BlobStringReply<'width'>, NumberReply],
  [BlobStringReply<'depth'>, NumberReply],
  [BlobStringReply<'decay'>, DoubleReply]
]>;

export type TkInfoReply = {
  k: NumberReply,
  width: NumberReply,
  depth: NumberReply,
  decay: number,
}
 
export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['TOPK.INFO', key];
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<TopKInfoReplyMap>>): TkInfoReply => {
      return {
        k: reply[1],
        width: reply[3],
        depth: reply[5],
        decay: Number(reply[7])
      }
    },
    3: (reply: UnwrapReply<TopKInfoReplyMap>): TkInfoReply => {
      if (reply instanceof Map) {
        throw new Error("BF.INFO shouldn't return a map type in resp3 anymore");
/*
        return {
          k: reply.get('k' as unknown as BlobStringReply<'k'>) as NumberReply,
          width: reply.get('width' as unknown as BlobStringReply<'width'>) as NumberReply,
          depth: reply.get('depth' as unknown as BlobStringReply<'depth'>) as NumberReply,
          decay: Number(reply.get('decay' as unknown as BlobStringReply<'decay'>) as DoubleReply)
        };
*/
      } else if (reply instanceof Array) {
        throw new Error("BF.INFO shouldn't return a array type in resp3 anymore");
/*
        return {
          k: reply[1],
          width: reply[3],
          depth: reply[5],
          decay: Number(reply[7])
        };
*/
      } else {
        return {
          k: reply['k'],
          width: reply['width'],
          depth: reply['depth'],
          decay: Number(reply['decay'])
        };
      }
    }
  },
  ignoreTypeMapping: true
} as const satisfies Command
