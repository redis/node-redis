import { CommandParser } from '../client/parser';
import { TuplesToMapReply, BlobStringReply, NumberReply, DoubleReply, ArrayReply, UnwrapReply, Command, TypeMapping } from '../RESP/types'; 
import { transformDoubleReply } from './generic-transformers';

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
  // FIXME: 'db.0', and perhaps others' is here and is a map that should be handled?
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
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the MEMORY STATS command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/memory-stats/
   */
  parseCommand(parser: CommandParser) {
    parser.push('MEMORY', 'STATS');
  },
  transformReply: {
    2: (rawReply: UnwrapReply<ArrayReply<BlobStringReply | NumberReply>>, preserve?: any, typeMapping?: TypeMapping) => {
      const reply: any = {};

      let i = 0;
      while (i < rawReply.length) {
        switch(rawReply[i].toString()) {
          case 'dataset.percentage':
          case 'peak.percentage':
          case 'allocator-fragmentation.ratio':
          case 'allocator-rss.ratio':
          case 'rss-overhead.ratio':
          case 'fragmentation':
            reply[rawReply[i++] as any] = transformDoubleReply[2](rawReply[i++] as unknown as BlobStringReply, preserve, typeMapping);
            break;
          default:
            reply[rawReply[i++] as any] = rawReply[i++];
        }
        
      }

      return reply as MemoryStatsReply;
    },
    3: undefined as unknown as () => MemoryStatsReply
  }
} as const satisfies Command;
