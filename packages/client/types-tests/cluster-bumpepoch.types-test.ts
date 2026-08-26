/**
 * Compile-time regression for the CLUSTER BUMPEPOCH reply type.
 *
 * Redis replies with the simple string "BUMPED <epoch>" or "STILL <epoch>"
 * (cluster_legacy.c), but the reply was declared as the literal union
 * 'BUMPED' | 'STILL', so `reply === 'BUMPED'` compiled while never matching
 * at runtime. The declared client-facing reply type must be a plain string.
 *
 * Lives outside lib/ so it is not picked up by the production build / typedoc.
 * Checked with `npm run test:types -w @redis/client`.
 */
import type { CommandReply, ReplyWithTypeMapping } from '../lib/RESP/types';
import type CLUSTER_BUMPEPOCH from '../lib/commands/CLUSTER_BUMPEPOCH';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;

type Assert<T extends true> = T;

type ClientReply = ReplyWithTypeMapping<CommandReply<typeof CLUSTER_BUMPEPOCH, 3>, {}>;

// must be a plain string: the epoch is appended to the literal prefix
export type ClientReplyIsString = Assert<Equal<ClientReply, string>>;

// must NOT collapse back to the bare literals
export type NotBareLiterals = Assert<Equal<ClientReply, 'BUMPED' | 'STILL'> extends true ? false : true>;
