import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, TuplesToMapReply, NumberReply, DoubleReply, UnwrapReply, Resp2Reply, Command, SimpleStringReply, TypeMapping } from '@redis/client/lib/RESP/types';
import { transformDoubleReply } from '@redis/client/lib/commands/generic-transformers';
import { transformInfoV2Reply } from '../bloom';

export type TopKInfoReplyMap = TuplesToMapReply<[
  [SimpleStringReply<'k'>, NumberReply],
  [SimpleStringReply<'width'>, NumberReply],
  [SimpleStringReply<'depth'>, NumberReply],
  [SimpleStringReply<'decay'>, DoubleReply]
]>;

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('TOPK.INFO');
    parser.pushKey(key);
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<TopKInfoReplyMap>>, preserve?: any, typeMapping?: TypeMapping): TopKInfoReplyMap => {
      reply[7] = transformDoubleReply[2](reply[7], preserve, typeMapping) as any;

      return transformInfoV2Reply<TopKInfoReplyMap>(reply, typeMapping);
    },
    3: undefined as unknown as () => TopKInfoReplyMap
  }
} as const satisfies Command
