/**
 * Compile-time regression: XTRIM's LIMIT is only accepted by the server
 * together with the approximate modifier ("syntax error, LIMIT cannot be used
 * without the special ~ option", t_stream.c), so the options type must not
 * allow LIMIT without strategyModifier '~'.
 *
 * Lives outside `lib/` so it is not picked up by the production build /
 * typedoc. Checked with `npm run test:types -w @redis/client`.
 */
import { XTrimOptions } from '../lib/commands/XTRIM';

export function xtrimLimitRequiresApproximateModifier(): void {
    // LIMIT without '~' is rejected by the server.
    // @ts-expect-error LIMIT requires strategyModifier '~'
    const invalid: XTrimOptions = { LIMIT: 10 };

    const valid: XTrimOptions = { strategyModifier: '~', LIMIT: 10 };

    console.log(invalid, valid);
}
