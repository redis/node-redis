import { RedisArgument, TuplesToMapReply, BlobStringReply, NumberReply, UnwrapReply, Resp2Reply, Command } from '@redis/client/dist/lib/RESP/types';

export type CmsInfoReplyMap = TuplesToMapReply<[
  [BlobStringReply<'width'>, NumberReply],
  [BlobStringReply<'depth'>, NumberReply],
  [BlobStringReply<'count'>, NumberReply]
]>;

export interface CmsInfoReply {
  width?: NumberReply;
  depth?: NumberReply;
  count?: NumberReply;
}
 
export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['CMS.INFO', key];
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<CmsInfoReplyMap>>): CmsInfoReply => {
      return {
        width: reply[1],
        depth: reply[3],
        count: reply[5]
      }
    },
    3: (reply: UnwrapReply<CmsInfoReplyMap>): CmsInfoReply => {
      if (reply instanceof Map) {
        throw new Error("BF.INFO shouldn't return a nap type in resp3 anymore");
/*
        return {
          width: reply.get("width" as unknown as BlobStringReply<'width'>),
          depth: reply.get("depth" as unknown as BlobStringReply<"depth">),
          count: reply.get("count" as unknown as BlobStringReply<"count">)
        }
*/
      } else if (reply instanceof Array) {
        throw new Error("BF.INFO shouldn't return a array type in resp3 anymore");
/*
        return {
          width: reply[1],
          depth: reply[3],
          count: reply[5]
        }
*/
      } else {
        return {
          width: reply['width'],
          depth: reply['depth'],
          count: reply['count']
        }
      }
    }
  },
  ignoreTypeMapping: true
} as const satisfies Command;
