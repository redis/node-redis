import { CommandParser } from '../client/parser';
import { ArrayReply, TuplesToMapReply, BlobStringReply, NumberReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';

type ClusterLinksReply = ArrayReply<TuplesToMapReply<[
  [BlobStringReply<'direction'>, BlobStringReply],
  [BlobStringReply<'node'>, BlobStringReply],
  [BlobStringReply<'create-time'>, NumberReply],
  [BlobStringReply<'events'>, BlobStringReply],
  [BlobStringReply<'send-buffer-allocated'>, NumberReply],
  [BlobStringReply<'send-buffer-used'>, NumberReply],
]>>;

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns information about all cluster links (lower level connections to other nodes)
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('CLUSTER', 'LINKS');
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<ClusterLinksReply>>) => reply.map(link => {
      const unwrapped = link as unknown as UnwrapReply<typeof link>;
      return {
        direction: unwrapped[1],
        node: unwrapped[3],
        'create-time': unwrapped[5],
        events: unwrapped[7],
        'send-buffer-allocated': unwrapped[9],
        'send-buffer-used': unwrapped[11]
      };
    }),
    3: undefined as unknown as () => ClusterLinksReply
  }
} as const satisfies Command;
