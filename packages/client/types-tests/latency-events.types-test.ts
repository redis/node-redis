/**
 * Compile-time regression: the latency event unions must accept every event
 * the server samples via latencyAddSampleIfNeeded. aof-fstat (aof.c),
 * while-blocked-cron (server.c) and eviction-lazyfree (evict.c) are real
 * event names but were rejected by LATENCY HISTORY/GRAPH/RESET argument types.
 *
 * Lives outside `lib/` so it is not picked up by the production build /
 * typedoc. Checked with `npm run test:types -w @redis/client`.
 */
import { createClient } from '../index';

export async function latencyCommandsAcceptSampledEvents(client: ReturnType<typeof createClient>): Promise<void> {
    console.log(
        await client.latencyHistory('aof-fstat'),
        await client.latencyGraph('eviction-lazyfree'),
        await client.latencyReset('while-blocked-cron')
    );
}
