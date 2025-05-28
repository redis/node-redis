import { CommandParser } from '@redis/client/dist/lib/client/parser';
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
  IS_READ_ONLY: true,
  /**
   * Returns width, depth, and total count of items in a Count-Min Sketch
   * @param parser - The command parser
   * @param key - The name of the sketch to get information about
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('CMS.INFO');
    parser.pushKey(key);
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<CmsInfoReplyMap>>, _, typeMapping?: TypeMapping): CmsInfoReply => {
      return transformInfoV2Reply<CmsInfoReply>(reply, typeMapping);
    },
    3: undefined as unknown as () => CmsInfoReply
  }
} as const satisfies Command;
