import { TuplesToMapReply, NumberReply, DoubleReply, ArrayReply, UnwrapReply, Command, SimpleStringReply } from '../RESP/types'; 

export type MemoryStatsReply = TuplesToMapReply<[
  [SimpleStringReply<'peak.allocated'>, NumberReply],
  [SimpleStringReply<'total.allocated'>, NumberReply],
  [SimpleStringReply<'startup.allocated'>, NumberReply],
  [SimpleStringReply<'replication.backlog'>, NumberReply],
  [SimpleStringReply<'clients.slaves'>, NumberReply],
  [SimpleStringReply<'clients.normal'>, NumberReply],
  /** added in 7.0 */
  [SimpleStringReply<'cluster.links'>, NumberReply],
  [SimpleStringReply<'aof.buffer'>, NumberReply],
  [SimpleStringReply<'lua.caches'>, NumberReply],
  /** added in 7.0 */
  [SimpleStringReply<'functions.caches'>, NumberReply],
  [SimpleStringReply<'overhead.total'>, NumberReply],
  [SimpleStringReply<'keys.count'>, NumberReply],
  [SimpleStringReply<'keys.bytes-per-key'>, NumberReply],
  [SimpleStringReply<'dataset.bytes'>, NumberReply],
  [SimpleStringReply<'dataset.percentage'>, DoubleReply],
  [SimpleStringReply<'peak.percentage'>, DoubleReply],
  [SimpleStringReply<'allocator.allocated'>, NumberReply],
  [SimpleStringReply<'allocator.active'>, NumberReply],
  [SimpleStringReply<'allocator.resident'>, NumberReply],
  [SimpleStringReply<'allocator-fragmentation.ratio'>, DoubleReply],
  [SimpleStringReply<'allocator-fragmentation.bytes'>, NumberReply],
  [SimpleStringReply<'allocator-rss.ratio'>, DoubleReply],
  [SimpleStringReply<'allocator-rss.bytes'>, NumberReply],
  [SimpleStringReply<'rss-overhead.ratio'>, DoubleReply],
  [SimpleStringReply<'rss-overhead.bytes'>, NumberReply],
  [SimpleStringReply<'fragmentation'>, DoubleReply],
  [SimpleStringReply<'fragmentation.bytes'>, NumberReply]
]>;

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments() {
    return ['MEMORY', 'STATS'];
  },
  transformReply: {
    2: (rawReply: UnwrapReply<ArrayReply<SimpleStringReply | NumberReply>>) => {
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
