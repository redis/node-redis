import { TuplesToMapReply, NumberReply, DoubleReply, ArrayReply, UnwrapReply, Command, BlobStringReply } from '../RESP/types'; 

export type MemoryStatsReply = TuplesToMapReply<[
  [BlobStringReply<'peak.allocated'>, NumberReply],
  [BlobStringReply<'total.allocated'>, NumberReply],
  [BlobStringReply<'startup.allocated'>, NumberReply],
  [BlobStringReply<'replication.backlog'>, NumberReply],
  [BlobStringReply<'clients.slaves'>, NumberReply],
  [BlobStringReply<'clients.normal'>, NumberReply],
  /** added in 7.0 */
  [BlobStringReply<'cluster.links'>, NumberReply],
  [BlobStringReply<'aof.buffer'>, NumberReply],
  [BlobStringReply<'lua.caches'>, NumberReply],
  /** added in 7.0 */
  [BlobStringReply<'functions.caches'>, NumberReply],
  [BlobStringReply<'overhead.total'>, NumberReply],
  [BlobStringReply<'keys.count'>, NumberReply],
  [BlobStringReply<'keys.bytes-per-key'>, NumberReply],
  [BlobStringReply<'dataset.bytes'>, NumberReply],
  [BlobStringReply<'dataset.percentage'>, DoubleReply],
  [BlobStringReply<'peak.percentage'>, DoubleReply],
  [BlobStringReply<'allocator.allocated'>, NumberReply],
  [BlobStringReply<'allocator.active'>, NumberReply],
  [BlobStringReply<'allocator.resident'>, NumberReply],
  [BlobStringReply<'allocator-fragmentation.ratio'>, DoubleReply],
  [BlobStringReply<'allocator-fragmentation.bytes'>, NumberReply],
  [BlobStringReply<'allocator-rss.ratio'>, DoubleReply],
  [BlobStringReply<'allocator-rss.bytes'>, NumberReply],
  [BlobStringReply<'rss-overhead.ratio'>, DoubleReply],
  [BlobStringReply<'rss-overhead.bytes'>, NumberReply],
  [BlobStringReply<'fragmentation'>, DoubleReply],
  [BlobStringReply<'fragmentation.bytes'>, NumberReply]
]>;

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments() {
    return ['MEMORY', 'STATS'];
  },
  transformReply: {
    2: (rawReply: UnwrapReply<ArrayReply<BlobStringReply | NumberReply>>) => {
      const reply: any = {};

      let i = 0;
      while (i < rawReply.length) {
        reply[rawReply[i++] as any] = rawReply[i++];
      }

      return reply as MemoryStatsReply['DEFAULT'];
    },
    3: undefined as unknown as () => MemoryStatsReply
  }
} as const satisfies Command;
