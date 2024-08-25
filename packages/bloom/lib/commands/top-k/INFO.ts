import { transformDoubleReply } from '@redis/client/dist/lib/commands/generic-transformers';
import { RedisArgument, TuplesToMapReply, NumberReply, DoubleReply, UnwrapReply, Resp2Reply, Command, SimpleStringReply, TypeMapping } from '@redis/client/dist/lib/RESP/types';

export type TopKInfoReplyMap = TuplesToMapReply<[
  [SimpleStringReply<'k'>, NumberReply],
  [SimpleStringReply<'width'>, NumberReply],
  [SimpleStringReply<'depth'>, NumberReply],
  [SimpleStringReply<'decay'>, DoubleReply]
]>;

export type TkInfoReply = {
  k: NumberReply;
  width: NumberReply;
  depth: NumberReply;
  decay: DoubleReply;
}
 
export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['TOPK.INFO', key];
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<TopKInfoReplyMap>>, preserve?: any, typeMapping?: TypeMapping): TkInfoReply => {
      return {
        k: reply[1],
        width: reply[3],
        depth: reply[5],
        decay: transformDoubleReply[2](reply[7], preserve, typeMapping)
      };
    },
    3: (reply: UnwrapReply<TopKInfoReplyMap>): TkInfoReply => {
      if (reply instanceof Map) {
        return {
          k: reply.get('k') as NumberReply,
          width: reply.get('width') as NumberReply,
          depth: reply.get('depth') as NumberReply,
          decay: reply.get('decay') as DoubleReply
        };
      } else if (reply instanceof Array) {
        return {
          k: reply[1],
          width: reply[3],
          depth: reply[5],
          decay: reply[7]
        };
      } else {
        return {
          k: reply['k'],
          width: reply['width'],
          depth: reply['depth'],
          decay: reply['decay']
        };
      }
    }
  }
} as const satisfies Command
