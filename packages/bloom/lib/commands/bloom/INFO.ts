import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command, UnwrapReply, NullReply, NumberReply, TuplesToMapReply, Resp2Reply, SimpleStringReply, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import { transformInfoV2Reply } from './helpers';

export type BfInfoReplyMap = TuplesToMapReply<[
  [SimpleStringReply<'Capacity'>, NumberReply],
  [SimpleStringReply<'Size'>, NumberReply],
  [SimpleStringReply<'Number of filters'>, NumberReply],
  [SimpleStringReply<'Number of items inserted'>, NumberReply],
  [SimpleStringReply<'Expansion rate'>, NullReply | NumberReply] 
]>;

export default {
  IS_READ_ONLY: true,
  /**
   * Returns information about a Bloom Filter, including capacity, size, number of filters, items inserted, and expansion rate
   * @param parser - The command parser
   * @param key - The name of the Bloom filter to get information about
   */
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
