import { ArrayReply, TuplesToMapReply, BlobStringReply, NumberReply, Resp2Reply, Command } from '../RESP/types';

type ClusterLinksReply = ArrayReply<TuplesToMapReply<[
  [BlobStringReply<'direction'>, BlobStringReply],
  [BlobStringReply<'node'>, BlobStringReply],
  [BlobStringReply<'create-time'>, NumberReply],
  [BlobStringReply<'events'>, BlobStringReply],
  [BlobStringReply<'send-buffer-allocated'>, NumberReply],
  [BlobStringReply<'send-buffer-used'>, NumberReply],
]>>;

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments() {
    return ['CLUSTER', 'LINKS'];
  },
  transformReply: {
    2: (reply: Resp2Reply<ClusterLinksReply>) => reply.map(link => ({
      direction: link[1],
      node: link[3],
      'create-time': link[5],
      events: link[7],
      'send-buffer-allocated': link[9],
      'send-buffer-used': link[11]
    })),
    3: undefined as unknown as () => ClusterLinksReply
  }
} as const satisfies Command;
