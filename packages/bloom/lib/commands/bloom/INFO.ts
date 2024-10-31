import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, Command, UnwrapReply, NullReply, NumberReply, TuplesToMapReply, Resp2Reply, SimpleStringReply, TypeMapping } from '@redis/client/lib/RESP/types';
import { transformInfoV2Reply } from '.';

export type BfInfoReplyMap = TuplesToMapReply<[
  [SimpleStringReply<'Capacity'>, NumberReply],
  [SimpleStringReply<'Size'>, NumberReply],
  [SimpleStringReply<'Number of filters'>, NumberReply],
  [SimpleStringReply<'Number of items inserted'>, NumberReply],
  [SimpleStringReply<'Expansion rate'>, NullReply | NumberReply] 
]>;

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('BF.INFO');
    parser.pushKey(key);
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<BfInfoReplyMap>>, _, typeMapping?: TypeMapping): BfInfoReplyMap => {
      return transformInfoV2Reply<BfInfoReplyMap>(reply, typeMapping);
    },
    3: undefined as unknown as () => BfInfoReplyMap
  }
} as const satisfies Command;
