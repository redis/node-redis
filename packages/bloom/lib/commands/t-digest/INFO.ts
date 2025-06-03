import { CommandParser } from '@redis/client/dist/lib/client/parser';
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
  IS_READ_ONLY: true,
  /**
   * Returns information about a t-digest sketch including compression, capacity, nodes, weights, observations and memory usage
   * @param parser - The command parser
   * @param key - The name of the t-digest sketch to get information about
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('TDIGEST.INFO');
    parser.pushKey(key);
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<TdInfoReplyMap>>, _, typeMapping?: TypeMapping): TdInfoReplyMap => {
      return transformInfoV2Reply<TdInfoReplyMap>(reply, typeMapping);
    },
    3: undefined as unknown as () => TdInfoReplyMap
  }
} as const satisfies Command;
