/**
 * Compile-time regression: the MEMORY STATS reply type must expose the fields
 * Redis added in 7.4 (overhead.db.hashtable.lut, overhead.db.hashtable.rehashing,
 * db.dict.rehashing.count, allocator.muzzy). They are top-level integers in the
 * server's reply (object.c memoryCommand), but were absent from
 * MemoryStatsReply, so consumers could not access them without casting.
 *
 * Lives outside `lib/` so it is not picked up by the production build /
 * typedoc. Checked with `npm run test:types -w @redis/client`.
 */
import { createClient } from '../index';

type Client = ReturnType<typeof createClient>;
type MemoryStats = Awaited<ReturnType<Client['memoryStats']>>;

export function memoryStatsExposesRedis74Fields(stats: MemoryStats): void {
    const hashtableLut: number = stats['overhead.db.hashtable.lut'];
    const hashtableRehashing: number = stats['overhead.db.hashtable.rehashing'];
    const dictRehashingCount: number = stats['db.dict.rehashing.count'];
    const allocatorMuzzy: number = stats['allocator.muzzy'];

    // These fields are numbers, not strings.
    // @ts-expect-error allocator.muzzy is a number
    const notAString: string = stats['allocator.muzzy'];

    if (process.env.NODE_ENV !== 'production') {
        console.log(hashtableLut, hashtableRehashing, dictRehashingCount, allocatorMuzzy, notAString);
    }
}
