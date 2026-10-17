import { BasicCommandParser, type CommandParser } from '../../client/parser';
import type { RedisArgument } from '../../RESP/types';
import type { RequestRouter, RoutedCommand } from './dispatch';
import { argToString, upperCommand } from './ft-cursor';

// Routing/finalization runs below the typed command surface (see dispatch.ts),
// so the slots handle is the erased base instantiation. `_executeWithPolicies`
// bridges its own typed slots in at the call boundary.
type ClusterSlots = Parameters<RequestRouter>[0];

/**
 * Wire commands that get cluster-wide SCAN's multi-master chaining, and the
 * index of their cursor argument. Keyed like `SPECIAL_REQUEST_ROUTERS`: bare
 * `SCAN`'s own second token *is* the cursor (not a real subcommand), so it
 * only matches the bare-command key below; a command whose second token is a
 * real subcommand keyword (e.g. `BLESS SCAN`) matches the `"COMMAND
 * SUBCOMMAND"` key first, at its own cursor index.
 */
const SCAN_CURSOR_ARG_INDEX: ReadonlyMap<string, number> = new Map([
  ['SCAN', 1],
  ['BLESS SCAN', 2]
]);

/**
 * Resolves the scan-chain label and cursor-argument index for this parser's
 * command, or `undefined` if it isn't a scan-chained command at all.
 */
function resolveScanCommand(parser: CommandParser): { label: string, cursorIndex: number } | undefined {
  const command = upperCommand(parser);
  const { subcommand } = parser.commandIdentifier;
  if (subcommand !== undefined) {
    const label = `${command} ${subcommand.toUpperCase()}`;
    const cursorIndex = SCAN_CURSOR_ARG_INDEX.get(label);
    if (cursorIndex !== undefined) return { label, cursorIndex };
  }
  const cursorIndex = SCAN_CURSOR_ARG_INDEX.get(command);
  return cursorIndex === undefined ? undefined : { label: command, cursorIndex };
}

/**
 * Cluster-wide SCAN and SCAN-shaped commands (server `request_policy: special`
 * + `response_policy: special`, e.g. SCAN, BLESS SCAN). Their cursors are
 * per-node state, so the cluster iteration walks the masters one at a time
 * behind a *virtual* cursor:
 *
 *  - cursor `0` starts a chain on the first master.
 *  - Each reply's server cursor is swapped for a client-minted token that maps
 *    back to (serving node, real cursor, masters already exhausted). The
 *    caller keeps its usual `cursor !== "0"` loop; the token is opaque.
 *  - When a node's cursor returns 0 the chain advances to the next unvisited
 *    master (fresh cursor 0); when every master is exhausted the caller
 *    finally sees "0".
 *
 * The visited set is tracked by node address, so a topology change mid-scan
 * neither rescans a surviving node nor gets stuck on a departed one. The usual
 * SCAN guarantees apply per node; keys migrating between nodes mid-iteration
 * may be missed or duplicated — same caveat as every cluster-wide scan.
 *
 * Tokens are minted from one counter shared by every scan-chained command
 * (see `ScanCursorEntry.label` in `cluster-slots.ts`), so a token bound by one
 * command is rejected — not silently reused — if handed to another.
 */
export const routeScan: RequestRouter = async (slots, parser) => {
  const resolved = resolveScanCommand(parser);
  // Only reachable via SPECIAL_REQUEST_ROUTERS registration, so this is
  // always resolvable; guard anyway rather than trust the call site.
  if (!resolved) return [{ client: await slots.nodeClient(slots.getRandomNode()) }];
  const { label, cursorIndex } = resolved;

  // Malformed raw command (missing cursor): forward to any node so the server
  // returns its own arity error instead of a client-side TypeError.
  if (parser.redisArgs.length <= cursorIndex) {
    return [{ client: await slots.nodeClient(slots.getRandomNode()) }];
  }

  const cursorArg = argToString(parser.redisArgs[cursorIndex]);

  if (cursorArg === '0') {
    const address = slots.nextScanTarget(EMPTY_VISITED);
    if (!address) throw new Error(`${label}: no master nodes available`);
    return [{ client: await pinnedMaster(slots, address, label) }];
  }

  const entry = slots.lookupScanCursor(cursorArg);
  if (!entry || entry.label !== label) {
    throw new Error(
      `${label}: unknown cursor "${cursorArg}". Cluster-wide ${label} cursors are ` +
      `minted per client instance and expire when idle — restart the scan from 0.`
    );
  }
  return [{
    client: await pinnedMaster(slots, entry.address, label),
    parser: withCursor(parser, cursorIndex, entry.cursor)
  }];
};

const EMPTY_VISITED: ReadonlySet<string> = new Set();

async function pinnedMaster(slots: ClusterSlots, address: string, label: string) {
  const client = await slots.getMasterByAddress(address);
  if (!client) {
    throw new Error(
      `${label}: node ${address} serving this cursor has left the cluster — ` +
      `restart the scan from 0.`
    );
  }
  return client;
}

/** Copy of the parser with the cursor argument (at `cursorIndex`) replaced. */
function withCursor(parser: CommandParser, cursorIndex: number, cursor: string): CommandParser {
  const sub = new BasicCommandParser();
  const { redisArgs } = parser;
  for (let i = 0; i < redisArgs.length; i++) {
    sub.push(i === cursorIndex ? cursor : redisArgs[i] as RedisArgument);
  }
  return sub;
}

/**
 * Post-reply hook for scan-chained commands (invoked from
 * `_executeWithPolicies` after the reducer, like `finalizeFtCursor`):
 * advances the chain state and swaps the server cursor in the reply for the
 * chain's virtual token. No-op for any other command or a non-single-target
 * plan. Returns the (possibly rewritten) reply.
 */
export function finalizeScanCursor(
  slots: ClusterSlots,
  parser: CommandParser,
  plan: ReadonlyArray<RoutedCommand>,
  reply: unknown
): unknown {
  const resolved = resolveScanCommand(parser);
  if (!resolved) return reply;
  const { label, cursorIndex } = resolved;
  if (plan.length !== 1 || !plan[0].client) return reply;

  const serverCursor = extractScanCursor(reply);
  if (serverCursor === undefined) return reply;

  const address = slots.nodeAddressByClient(plan[0].client);
  if (!address) return reply;

  const callerCursor = argToString(parser.redisArgs[cursorIndex]);
  const chain = callerCursor === '0' ? undefined : slots.lookupScanCursor(callerCursor);
  // A token bound by a different scan-chained command is not this chain's —
  // treat it as fresh (start of chain) rather than borrow its visited set.
  const visited = chain?.label === label ? chain.visited : new Set<string>();

  if (argToString(serverCursor) !== '0') {
    // Node not exhausted: resume it next call with the real cursor.
    const token = callerCursor === '0' ? slots.mintCursorToken() : callerCursor;
    slots.bindScanCursor(token, address, argToString(serverCursor), visited, label);
    return withReplyCursor(reply, token, serverCursor);
  }

  // Node exhausted: advance to the next unvisited master, or finish.
  visited.add(address);
  const next = slots.nextScanTarget(visited);
  if (!next) {
    if (callerCursor !== '0') slots.evictScanCursor(callerCursor);
    return reply; // server cursor is already "0" — the chain is done
  }
  const token = callerCursor === '0' ? slots.mintCursorToken() : callerCursor;
  slots.bindScanCursor(token, next, '0', visited, label);
  return withReplyCursor(reply, token, serverCursor);
}

/**
 * Pull the cursor out of a SCAN-shaped reply across both reply paths:
 *   - transformed command path → `{ cursor, keys }`,
 *   - raw `sendCommand` → `[cursor, keys]` (cursor at index 0).
 * Returns `undefined` for anything else (unknown shape → leave the reply be).
 */
function extractScanCursor(reply: unknown): RedisArgument | undefined {
  if (reply == null) return undefined;

  if (Array.isArray(reply)) {
    return isCursorValue(reply[0]) ? reply[0] : undefined;
  }

  if (typeof reply === 'object' && 'cursor' in (reply as Record<string, unknown>)) {
    const cursor = (reply as Record<string, unknown>).cursor;
    return isCursorValue(cursor) ? cursor : undefined;
  }

  return undefined;
}

function isCursorValue(value: unknown): value is RedisArgument {
  return typeof value === 'string' || value instanceof Buffer;
}

/**
 * Rebuild the reply with the virtual token in place of the server cursor,
 * preserving the reply shape and the cursor's wire type (Buffer stays Buffer
 * under a Buffer type mapping).
 */
function withReplyCursor(reply: unknown, token: string, original: RedisArgument): unknown {
  const cursor = original instanceof Buffer ? Buffer.from(token) : token;

  if (Array.isArray(reply)) {
    const copy = reply.slice();
    copy[0] = cursor;
    return copy;
  }
  return { ...(reply as Record<string, unknown>), cursor };
}
