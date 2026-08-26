/**
 * Compile-time regression: XADD's TRIM.strategy must be required. The official
 * grammar makes MAXLEN|MINID mandatory inside the trim block; with the strategy
 * omitted, parseXAddArguments emitted a bare threshold which the server parses
 * as the entry ID instead of a trim instruction.
 *
 * Lives outside `lib/` so it is not picked up by the production build /
 * typedoc. Checked with `npm run test:types -w @redis/client`.
 */
import { XAddOptions } from '../lib/commands/XADD';

export function xaddTrimRequiresStrategy(): void {
    // @ts-expect-error TRIM.strategy is required alongside threshold
    const invalidTrim: NonNullable<XAddOptions['TRIM']> = { threshold: 1000 };
    console.log(invalidTrim);
}
