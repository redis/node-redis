import { transformDoubleReply } from '@redis/client/dist/lib/commands/generic-transformers';
import { RedisArgument, TuplesToMapReply, NumberReply, DoubleReply, UnwrapReply, Resp2Reply, Command, SimpleStringReply, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import { transformInfoV2Reply } from '../bloom';

export type TopKInfoReplyMap = TuplesToMapReply<[
  [SimpleStringReply<'k'>, NumberReply],
  [SimpleStringReply<'width'>, NumberReply],
  [SimpleStringReply<'depth'>, NumberReply],
  [SimpleStringReply<'decay'>, DoubleReply]
]>;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['TOPK.INFO', key];
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<TopKInfoReplyMap>>, preserve?: any, typeMapping?: TypeMapping): TopKInfoReplyMap => {
      reply[7] = transformDoubleReply[2](reply[7], preserve, typeMapping) as any;

      return transformInfoV2Reply<TopKInfoReplyMap>(reply, typeMapping);
    },
    3: undefined as unknown as () => TopKInfoReplyMap
  }
} as const satisfies Command
