import type { CommandMetadata } from './policies-constants';

/**
 * Whether it is safe to route a command to a replica.
 *
 * In node-redis `Command.IS_READ_ONLY` means, for all intents and purposes,
 * "safe to send to a replica" — it is consumed only by the cluster and sentinel
 * routers to choose replica vs master.
 *
 * Override-first: a defined `IS_READ_ONLY` (or an explicit `isReadonly`
 * argument on the raw `sendCommand` path) is deliberate intent and always
 * wins — per-command corrections live in the command definitions, not in the
 * generated table. Only when no intent is declared does the table decide:
 *
 *   - `write` flag → never replica-safe. This is the server's own rejection
 *     signal: a read-only replica rejects a command iff it carries `CMD_WRITE`
 *     (`processCommand`, redis/src/server.c — "-READONLY You can't write
 *     against a read only replica."). The `readonly` flag is deliberately NOT
 *     consulted: its definition is broader (ACL `@read`, key-spec RO/RW, ...)
 *     and not 1:1 with replica-safety.
 *   - `script_runner` flag (EVAL/EVALSHA/FCALL family) → not replica-safe by
 *     default: the server cannot statically know whether a script writes, so
 *     routing is master unless the script/command declares `IS_READ_ONLY`
 *     (`defineScript`, or the hand-set value on the `_RO` variants).
 *   - otherwise, keyed → replica-safe. Every keyed non-write command is a data
 *     read the replica can serve.
 *   - keyless → not replica-safe. The flagless-keyless bucket is admin,
 *     connection-state and pub/sub commands (SHUTDOWN, FAILOVER, HELLO, AUTH,
 *     MULTI, ...) where "no write flag" does not mean "sensible on a replica"
 *     — SHUTDOWN is accepted by a replica and shuts it down. Read-ish members
 *     (PING, INFO, TIME, ...) opt back in via `IS_READ_ONLY: true` overrides
 *     in their command definitions.
 *
 * Unknown commands (user scripts/functions/unknown modules miss the table)
 * with no declared intent default to master — the safe choice.
 */
export function isReplicaSafe(
  meta: CommandMetadata | undefined,
  override: boolean | undefined
): boolean {
  if (override !== undefined) return override;
  if (!meta?.flags) return false;
  if (meta.flags.includes('write')) return false;
  if (meta.flags.includes('script_runner')) return false;
  return !meta.isKeyless;
}

/**
 * Whether a command's reply is eligible for client-side caching (CSC).
 *
 * Override-first, like `isReplicaSafe`: a defined `Command.CACHEABLE` always
 * wins (e.g. `CACHEABLE: false` on commands whose server metadata makes them
 * look cacheable when they are not — TOUCH only bumps LRU/LFU and generates no
 * invalidation). With no declared intent, the cross-client CSC "Command
 * Eligibility" algorithm decides: a command is cacheable if all of the
 * following hold —
 *   - no `dont_cache` tip (explicit negative override),
 *   - has the `readonly` flag,
 *   - takes at least one key-name argument (`!isKeyless`; CSC invalidation is
 *     key-tracking based, so keyless read-only commands like KEYS must not cache),
 *   - no `nondeterministic_output` tip (value nondeterminism; `*_output_order`
 *     is fine — HGETALL/SMEMBERS stay cacheable),
 *   - no `script` / `script_runner` flag (EVAL_RO/EVALSHA_RO/FCALL_RO).
 *
 * Unknown commands with no declared intent are not cacheable.
 */
export function isCacheable(
  meta: CommandMetadata | undefined,
  override: boolean | undefined
): boolean {
  if (override !== undefined) return override;
  if (!meta?.flags) return false;
  const tips = meta.tips ?? [];
  return !tips.includes('dont_cache')
    && meta.flags.includes('readonly')
    && !meta.isKeyless
    && !tips.includes('nondeterministic_output')
    // `script` (HLD name) / `script_runner` (the flag Redis 8.10 ships) mark the
    // EVAL_RO/EVALSHA_RO/FCALL_RO family, which must not cache.
    && !meta.flags.includes('script')
    && !meta.flags.includes('script_runner');
}
