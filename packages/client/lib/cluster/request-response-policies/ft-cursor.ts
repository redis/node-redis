import { BasicCommandParser, type CommandParser } from '../../client/parser';
import type { RedisArgument } from '../../RESP/types';
import type { RequestRouter, RoutedCommand } from './dispatch';

// Routing/capture runs below the typed command surface (see dispatch.ts), so
// the slots handle is the erased base instantiation. `_executeWithPolicies`
// bridges its own typed slots in at the call boundary.
type ClusterSlots = Parameters<RequestRouter>[0];

/** RediSearch index names are case-sensitive raw wire strings; mirror them. */
export function argToString(arg: RedisArgument): string {
  return typeof arg === 'string' ? arg : arg.toString();
}

/**
 * Pull the continuation cursor out of an FT.AGGREGATE …WITHCURSOR /
 * FT.CURSOR READ reply, across every reply path:
 *   - transformed command path → `{ total, results, cursor }` (RESP2 + RESP3),
 *   - raw RESP2 `sendCommand` → `[result, cursor]` (cursor at index 1),
 *   - raw RESP3 `sendCommand` → a map with a `cursor` key (Map or object).
 * The value is returned as decoded (number, or string under a NUMBER type
 * mapping) so a reply rewrite can preserve its wire type. Returns `undefined`
 * when no cursor field is present (e.g. FT.CURSOR DEL).
 */
export function extractCursorValue(reply: unknown): number | string | undefined {
  if (reply == null) return undefined;

  if (reply instanceof Map) {
    return reply.has('cursor') ? asCursorValue(reply.get('cursor')) : undefined;
  }

  if (Array.isArray(reply)) {
    return asCursorValue(reply[1]);
  }

  if (typeof reply === 'object' && 'cursor' in (reply as Record<string, unknown>)) {
    return asCursorValue((reply as Record<string, unknown>).cursor);
  }

  return undefined;
}

function asCursorValue(value: unknown): number | string | undefined {
  if (typeof value === 'number' || typeof value === 'string') return value;
  return undefined;
}

function isExhausted(cursor: number | string): boolean {
  return cursor === 0 || cursor === '0';
}

/**
 * Read the numeric MAXIDLE (ms) an FT.AGGREGATE …WITHCURSOR declared, if any.
 * `MAXIDLE 0` means "no idle limit" server-side (clamped to the server
 * default), so it maps to `undefined` — the binding falls back to the default
 * client-side TTL instead of expiring instantly.
 */
function maxIdleFromAggregateArgs(redisArgs: ReadonlyArray<RedisArgument>): number | undefined {
  for (let i = 0; i < redisArgs.length - 1; i++) {
    if (argToString(redisArgs[i]).toUpperCase() === 'MAXIDLE') {
      const n = Number(argToString(redisArgs[i + 1]));
      return Number.isNaN(n) || n <= 0 ? undefined : n;
    }
  }
  return undefined;
}

/**
 * Sticky router for FT.CURSOR READ/DEL (HLD `request_policy: special`).
 *
 * The cursor argument the caller holds is a client-minted virtual token, not
 * the server's cursor id: server ids are minted per node and two shards can
 * mint the same id for one index, so the raw id cannot identify its node. The
 * token resolves through the binding map to (node address, real cursor id) —
 * pin that node and rewrite the cursor argument to the real id on the wire.
 *
 * A MISS (token never minted here, chain already exhausted, or expired) is
 * unusable by this client, so throw before any network call rather than fan
 * out or guess.
 */
export const routeFtCursor: RequestRouter = async (slots, parser) => {
  const { redisArgs } = parser;
  const token = argToString(redisArgs[3]);

  const binding = slots.lookupCursor(token);
  if (binding) {
    const client = await slots.getMasterByAddress(binding.address);
    if (client) return [{ client, parser: withCursorArg(parser, binding.cursorId) }];

    throw new Error(
      `FT.CURSOR: the node serving cursor ${token} on index "${argToString(redisArgs[2])}" ` +
      `has left the cluster.`
    );
  }

  throw new Error(
    `FT.CURSOR: unknown cursor ${token} on index "${argToString(redisArgs[2])}". ` +
    `Cluster cursors are minted per client instance and expire when idle — ` +
    `the cursor was not created by this client, has already been exhausted, ` +
    `or has expired.`
  );
};

/** Copy of the FT.CURSOR parser with the cursor argument (index 3) replaced. */
function withCursorArg(parser: CommandParser, cursorId: string): CommandParser {
  const sub = new BasicCommandParser();
  const { redisArgs } = parser;
  for (let i = 0; i < redisArgs.length; i++) {
    sub.push(i === 3 ? cursorId : redisArgs[i] as RedisArgument);
  }
  return sub;
}

/**
 * Command-name-gated post-reply hook for FT.AGGREGATE / FT.CURSOR (invoked
 * from `_executeWithPolicies` after the reducer, like `finalizeScanCursor`).
 * Mints/rebinds/evicts the sticky binding and swaps the server cursor id in
 * the reply for the client token, so the caller only ever loops on tokens.
 * No-op for any other command, and for multi-target plans (cursor commands
 * are single-node). Returns the (possibly rewritten) reply.
 */
export function finalizeFtCursor(
  slots: ClusterSlots,
  parser: CommandParser,
  plan: ReadonlyArray<RoutedCommand>,
  reply: unknown
): unknown {
  const { command, subcommand } = parser.commandIdentifier;
  const cmd = command.toUpperCase();

  if (cmd !== 'FT.AGGREGATE' && cmd !== 'FT.CURSOR') return reply;
  if (plan.length !== 1) return reply;

  const { redisArgs } = parser;

  if (cmd === 'FT.AGGREGATE') {
    const cursor = extractCursorValue(reply);
    // cursor 0 → exhausted in one batch, nothing to pin.
    if (cursor === undefined || isExhausted(cursor)) return reply;

    const client = plan[0].client;
    if (!client) return reply;
    const address = slots.nodeAddressByClient(client);
    if (!address) return reply;

    const token = slots.mintCursorToken();
    slots.bindCursor(token, {
      address,
      cursorId: argToString(cursor as RedisArgument),
      maxIdleMs: maxIdleFromAggregateArgs(redisArgs)
    });
    return withReplyCursor(reply, token, cursor);
  }

  // FT.CURSOR READ / DEL — the caller-held token is at arg 3 (the routed
  // sub-parser carries the real id; this hook receives the original parser).
  const sub = subcommand === undefined ? undefined : argToString(subcommand).toUpperCase();
  const token = argToString(redisArgs[3]);

  if (sub === 'DEL') {
    // Self-cleaning: evict locally regardless of the server reply.
    slots.evictCursor(token);
    return reply;
  }

  if (sub === 'READ') {
    const binding = slots.lookupCursor(token);
    if (!binding) return reply; // never bound here — nothing to maintain

    const next = extractCursorValue(reply);
    if (next === undefined || isExhausted(next)) {
      slots.evictCursor(token); // exhausted
      return reply; // the server's 0 ends the caller's loop as-is
    }

    // Same node serves the continuation; refresh createdAt, keep MAXIDLE, and
    // track the (usually unchanged) real id. The caller keeps its token.
    slots.bindCursor(token, {
      address: binding.address,
      cursorId: argToString(next as RedisArgument),
      maxIdleMs: binding.maxIdleMs
    });
    return withReplyCursor(reply, token, next);
  }

  return reply;
}

/**
 * Rebuild the reply with the virtual token in place of the server cursor id,
 * preserving the reply shape and the cursor's decoded type (a string cursor —
 * NUMBER: String mapping — stays a string).
 */
function withReplyCursor(reply: unknown, token: string, original: number | string): unknown {
  const cursor = typeof original === 'number' ? Number(token) : token;

  if (reply instanceof Map) {
    const copy = new Map(reply as Map<unknown, unknown>);
    copy.set('cursor', cursor);
    return copy;
  }

  if (Array.isArray(reply)) {
    const copy = reply.slice();
    copy[1] = cursor;
    return copy;
  }

  return { ...(reply as Record<string, unknown>), cursor };
}
