import { CommandParser } from '../client/parser';
import { TuplesToMapReply, BlobStringReply, SetReply, NumberReply, ArrayReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';

type TrackingInfo = TuplesToMapReply<[
  [BlobStringReply<'flags'>, SetReply<BlobStringReply>],
  [BlobStringReply<'redirect'>, NumberReply],
  [BlobStringReply<'prefixes'>, ArrayReply<BlobStringReply>]
]>;

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns information about the current connection's key tracking state
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('CLIENT', 'TRACKINGINFO');
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<TrackingInfo>>) => ({
      flags: reply[1],
      redirect: reply[3],
      prefixes: reply[5]
    }),
    3: undefined as unknown as () => TrackingInfo
  }
} as const satisfies Command;
