/**
 * Compile-time regression for https://github.com/redis/node-redis/issues/3533.
 *
 * A missing vector set key or element is a nil reply. The client-facing type
 * must include null on both protocols, matching vLinks().
 *
 * Lives outside lib/ so it is not picked up by the production build / typedoc.
 * Checked with `npm run test:types -w @redis/client`.
 */
import type { CommandReply, ReplyWithTypeMapping } from '../lib/RESP/types';
import type VEMB from '../lib/commands/VEMB';
import type VEMB_RAW from '../lib/commands/VEMB_RAW';
import type VINFO from '../lib/commands/VINFO';
import type VLINKS_WITHSCORES from '../lib/commands/VLINKS_WITHSCORES';

type Assert<T extends true> = T;
type IncludesNull<T> = null extends ReplyWithTypeMapping<T, {}> ? true : false;

export type VEmbResp2 = Assert<IncludesNull<CommandReply<typeof VEMB, 2>>>;
export type VEmbResp3 = Assert<IncludesNull<CommandReply<typeof VEMB, 3>>>;
export type VEmbRawResp2 = Assert<IncludesNull<CommandReply<typeof VEMB_RAW, 2>>>;
export type VEmbRawResp3 = Assert<IncludesNull<CommandReply<typeof VEMB_RAW, 3>>>;
export type VInfoResp2 = Assert<IncludesNull<CommandReply<typeof VINFO, 2>>>;
export type VInfoResp3 = Assert<IncludesNull<CommandReply<typeof VINFO, 3>>>;
export type VLinksWithScoresResp2 = Assert<IncludesNull<CommandReply<typeof VLINKS_WITHSCORES, 2>>>;
export type VLinksWithScoresResp3 = Assert<IncludesNull<CommandReply<typeof VLINKS_WITHSCORES, 3>>>;
