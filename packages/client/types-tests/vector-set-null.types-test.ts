/**
 * Compile-time regression: VEMB, VEMB RAW, VINFO, VLINKS and VLINKS WITHSCORES
 * reply with nil for a missing key or element, so each reply type must accept
 * `null` on RESP2 and RESP3.
 *
 * Lives outside `lib/` so it is not picked up by the production build /
 * typedoc. Checked with `npm run test:types -w @redis/client`.
 */
import { createClient } from '../index';

type Client<RESP extends 2 | 3> = ReturnType<typeof createClient<{}, {}, {}, RESP>>;
type Reply<RESP extends 2 | 3, COMMAND extends keyof Client<RESP>> =
  Client<RESP>[COMMAND] extends (...args: never) => infer R ? Awaited<R> : never;

const vEmb2: Reply<2, 'vEmb'> = null;
const vEmb3: Reply<3, 'vEmb'> = null;
const vEmbRaw2: Reply<2, 'vEmbRaw'> = null;
const vEmbRaw3: Reply<3, 'vEmbRaw'> = null;
const vInfo2: Reply<2, 'vInfo'> = null;
const vInfo3: Reply<3, 'vInfo'> = null;
const vLinks2: Reply<2, 'vLinks'> = null;
const vLinks3: Reply<3, 'vLinks'> = null;
const vLinksWithScores2: Reply<2, 'vLinksWithScores'> = null;
const vLinksWithScores3: Reply<3, 'vLinksWithScores'> = null;

export const VECTOR_SET_REPLIES_INCLUDE_NULL = [
  vEmb2, vEmb3, vEmbRaw2, vEmbRaw3, vInfo2, vInfo3, vLinks2, vLinks3, vLinksWithScores2, vLinksWithScores3
] as const;
