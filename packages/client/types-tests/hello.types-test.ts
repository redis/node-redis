/**
 * Compile-time regression: each entry of the HELLO reply's modules field is a
 * structured entry (name, ver), not a plain string. The declared reply type
 * used to label it Array<BlobStringReply>, so consumers had no type-safe
 * access to the module fields. path and args exist only on Redis 7.0+ and are
 * intentionally left out of the declared shape, mirroring MODULE LIST.
 *
 * Lives outside `lib/` so it is not picked up by the production build /
 * typedoc. Checked with `npm run test:types -w @redis/client`.
 */
import { createClient } from '../index';

type Client = ReturnType<typeof createClient>;
type HelloReply = Awaited<ReturnType<Client['hello']>>;
type ModuleEntry = HelloReply['modules'][number];

export function helloModulesAreStructured(entry: ModuleEntry): void {
    // Mapped (RESP3-style) entries must expose the server's fields.
    if (!Array.isArray(entry)) {
        const name: string = entry.name;
        const ver: number = entry.ver;

        // A module version is a number, not a string.
        // @ts-expect-error module versions are numbers
        const notAString: string = entry.ver;

        if (process.env.NODE_ENV !== 'production') {
            console.log(name, ver, notAString);
        }

        return;
    }

    // Flat (RESP2-style) entries stay arrays.
    if (entry.length < 0) {
        console.log(entry);
    }
}
