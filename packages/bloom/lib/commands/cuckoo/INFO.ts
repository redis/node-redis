import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command, NumberReply, TuplesToMapReply, UnwrapReply, Resp2Reply, SimpleStringReply, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import { transformInfoV2Reply } from '../bloom';

export type CfInfoReplyMap = TuplesToMapReply<[
  [SimpleStringReply<'Size'>, NumberReply],
  [SimpleStringReply<'Number of buckets'>, NumberReply],
  [SimpleStringReply<'Number of filters'>, NumberReply],
  [SimpleStringReply<'Number of items inserted'>, NumberReply],
  [SimpleStringReply<'Number of items deleted'>, NumberReply],
  [SimpleStringReply<'Bucket size'>, NumberReply],
  [SimpleStringReply<'Expansion rate'>, NumberReply],
  [SimpleStringReply<'Max iterations'>, NumberReply]
]>;

export default {
  IS_READ_ONLY: true,
  /**
   * Returns detailed information about a Cuckoo Filter including size, buckets, filters count, items statistics and configuration
   * @param parser - The command parser
   * @param key - The name of the Cuckoo filter to get information about
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('CF.INFO');
    parser.pushKey(key);
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<CfInfoReplyMap>>, _, typeMapping?: TypeMapping): CfInfoReplyMap => {
      return transformInfoV2Reply<CfInfoReplyMap>(reply, typeMapping);
    },
    3: undefined as unknown as () => CfInfoReplyMap
  }
} as const satisfies Command;
