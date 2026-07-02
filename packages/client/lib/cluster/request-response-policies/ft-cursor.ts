import type { CommandParser } from '../../client/parser';
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
 * Pull the continuation cursor id out of an FT.AGGREGATE …WITHCURSOR /
 * FT.CURSOR READ reply, across every reply path:
 *   - transformed command path → `{ total, results, cursor }` (RESP2 + RESP3),
 *   - raw RESP2 `sendCommand` → `[result, cursor]` (cursor at index 1),
 *   - raw RESP3 `sendCommand` → a map with a `cursor` key (Map or object).
 * Returns `undefined` when no cursor field is present (e.g. FT.CURSOR DEL).
 */
export function extractCursorId(reply: unknown): number | undefined {
  if (reply == null) return undefined;

  if (reply instanceof Map) {
    return reply.has('cursor') ? toCursorNumber(reply.get('cursor')) : undefined;
  }

  if (Array.isArray(reply)) {
    return toCursorNumber(reply[1]);
  }

  if (typeof reply === 'object' && 'cursor' in (reply as Record<string, unknown>)) {
    return toCursorNumber((reply as Record<string, unknown>).cursor);
  }

  return undefined;
}

function toCursorNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

/** Read the numeric MAXIDLE (ms) an FT.AGGREGATE …WITHCURSOR declared, if any. */
function maxIdleFromAggregateArgs(redisArgs: ReadonlyArray<RedisArgument>): number | undefined {
  for (let i = 0; i < redisArgs.length - 1; i++) {
    if (argToString(redisArgs[i]).toUpperCase() === 'MAXIDLE') {
      const n = Number(argToString(redisArgs[i + 1]));
      return Number.isNaN(n) ? undefined : n;
    }
  }
  return undefined;
}

/**
 * Sticky router for FT.CURSOR READ/DEL (HLD `request_policy: special`). These
 * are keyless — there's no slot to route by — so we pin the exact node that
 * minted the cursor via its recorded binding. A MISS (never created here,
 * already exhausted, or the bound node left the cluster) is unusable by this
 * client, so throw before any network call rather than fan out or guess.
 */
export const routeFtCursor: RequestRouter = async (slots, parser) => {
  const { redisArgs } = parser;
  const index = argToString(redisArgs[2]);
  const cursorId = Number(argToString(redisArgs[3]));

  const binding = slots.lookupCursor(index, cursorId);
  if (binding) {
    const client = await slots.getMasterByAddress(binding.address);
    if (client) return [{ client }];
  }

  throw new Error(
    `FT.CURSOR: no known node for cursor ${cursorId} on index "${index}". ` +
    `The cursor was not created by this client instance, has already been ` +
    `exhausted, or the node that served it has left the cluster.`
  );
};

/** Special-request routers, keyed like `SPECIAL_RESPONSE_REDUCERS` (see dispatch.ts). */
export const SPECIAL_REQUEST_ROUTERS: Record<string, RequestRouter> = {
  'FT.CURSOR READ': routeFtCursor,
  'FT.CURSOR DEL': routeFtCursor
};

/**
 * Command-name-gated hook run after an FT.AGGREGATE / FT.CURSOR reply resolves
 * (HLD "hardcoded by command name"). Captures, rebinds, or evicts the sticky
 * cursor binding using the single-target plan's serving node. No-op for any
 * other command, and for multi-target plans (cursor commands are single-node).
 */
export function captureCursorBinding(
  slots: ClusterSlots,
  parser: CommandParser,
  plan: ReadonlyArray<RoutedCommand>,
  reply: unknown
): void {
  const { command, subcommand } = parser.commandIdentifier;
  const cmd = command.toUpperCase();
  const sub = subcommand?.toUpperCase();

  if (cmd !== 'FT.AGGREGATE' && cmd !== 'FT.CURSOR') return;
  if (plan.length !== 1) return;

  const { redisArgs } = parser;
  const client = plan[0].client;

  if (cmd === 'FT.AGGREGATE') {
    const cursor = extractCursorId(reply);
    // cursor 0 → exhausted in one batch, nothing to pin.
    if (!cursor || !client) return;
    const address = slots.nodeAddressByClient(client);
    if (address) {
      slots.bindCursor(argToString(redisArgs[1]), cursor, address, maxIdleFromAggregateArgs(redisArgs));
    }
    return;
  }

  // FT.CURSOR READ / DEL — index at arg 2, cursor id at arg 3.
  const index = argToString(redisArgs[2]);
  const cursorId = Number(argToString(redisArgs[3]));

  if (sub === 'DEL') {
    // Self-cleaning: evict locally regardless of the server reply.
    slots.evictCursor(index, cursorId);
    return;
  }

  if (sub === 'READ') {
    // Reuse the node that served this READ (the binding we routed by, or a
    // reverse-lookup of the pinned client) for any continuation cursor.
    const address = slots.lookupCursor(index, cursorId)?.address
      ?? (client ? slots.nodeAddressByClient(client) : undefined);
    const next = extractCursorId(reply);

    if (next === 0 || next === undefined) {
      slots.evictCursor(index, cursorId); // exhausted
    } else if (next !== cursorId) {
      slots.evictCursor(index, cursorId); // rebind continuation → same node
      if (address) slots.bindCursor(index, next, address);
    } else if (address) {
      slots.bindCursor(index, cursorId, address); // unchanged → refresh createdAt
    }
  }
}
