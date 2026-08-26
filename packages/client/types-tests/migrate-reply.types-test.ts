/**
 * Compile-time regression: MIGRATE replies +NOKEY when every requested key is
 * missing on the source instance (cluster.c addReplySds "+NOKEY"), so the
 * declared status union must include NOKEY alongside OK.
 *
 * Lives outside `lib/` so it is not picked up by the production build /
 * typedoc. Checked with `npm run test:types -w @redis/client`.
 */
import { createClient } from '../index';

type Client = ReturnType<typeof createClient>;

export function migrateReplyIncludesNokey(reply: Awaited<ReturnType<Client['migrate']>>): void {
    // Comparing against NOKEY must be a legal check on the declared union.
    if (reply === 'NOKEY') {
        console.log('nothing migrated');
        return;
    }
    console.log(reply);
}
