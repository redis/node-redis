import { CommandParser } from '../client/parser';
import { RedisArgument, Command, UnwrapReply, Resp2Reply, TuplesToMapReply, SimpleStringReply, NumberReply } from '../RESP/types';

export type VInfoReplyMap = TuplesToMapReply<[
  [SimpleStringReply<'quant-type'>, SimpleStringReply],
  [SimpleStringReply<'vector-dim'>, NumberReply],
  [SimpleStringReply<'size'>, NumberReply],
  [SimpleStringReply<'max-level'>, NumberReply],
  [SimpleStringReply<'vset-uid'>, NumberReply],
  [SimpleStringReply<'hnsw-max-node-uid'>, NumberReply],
]>;

export default {
  IS_READ_ONLY: true,
  /**
   * Retrieve metadata and internal details about a vector set, including size, dimensions, quantization type, and graph structure
   * 
   * @param parser - The command parser
   * @param key - The key of the vector set
   * @see https://redis.io/commands/vinfo/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('VINFO');
    parser.pushKey(key);
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<VInfoReplyMap>>): VInfoReplyMap => {
      const ret = Object.create(null);

      for (let i = 0; i < reply.length; i += 2) {
        ret[reply[i].toString()] = reply[i + 1];
      }

      return ret as unknown as VInfoReplyMap;
    },
    3: undefined as unknown as () => VInfoReplyMap
  }
} as const satisfies Command;
