import { RedisArgument, Command, NumberReply, TuplesToMapReply, UnwrapReply, Resp2Reply, SimpleStringReply, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import { transformInfoV2Reply } from '../bloom';

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

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['TDIGEST.INFO', key];
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<TdInfoReplyMap>>, _, typeMapping?: TypeMapping): TdInfoReplyMap => {
      return transformInfoV2Reply<TdInfoReplyMap>(reply, typeMapping);
    },
    3: undefined as unknown as () => TdInfoReplyMap
  }
} as const satisfies Command;
