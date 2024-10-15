import { RedisArgument, TuplesToMapReply, NumberReply, UnwrapReply, Resp2Reply, Command, SimpleStringReply, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import { transformInfoV2Reply } from '../bloom';

export type CmsInfoReplyMap = TuplesToMapReply<[
  [SimpleStringReply<'width'>, NumberReply],
  [SimpleStringReply<'depth'>, NumberReply],
  [SimpleStringReply<'count'>, NumberReply]
]>;

export interface CmsInfoReply {
  width: NumberReply;
  depth: NumberReply;
  count: NumberReply;
}
 
export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['CMS.INFO', key];
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<CmsInfoReplyMap>>, _, typeMapping?: TypeMapping): CmsInfoReply => {
      return transformInfoV2Reply<CmsInfoReply>(reply, typeMapping);
    },
    3: undefined as unknown as () => CmsInfoReply
  }
} as const satisfies Command;
