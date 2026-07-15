import type { CommandMetadata } from './policies-constants';

/**
 * Whether it is safe to route a command to a replica.
 *
 * In node-redis `Command.IS_READ_ONLY` means, for all intents and purposes,
 * "safe to send to a replica" — it is consumed only by the cluster and sentinel
 * routers to choose replica vs master. The server's `readonly` command flag is
 * NOT the right signal: its definition is broader (it also drives ACL `@read`,
 * key-spec RO/RW, etc.) and is not 1:1 with replica-safety.
 *
 * The authoritative signal is the `write` command flag. The server itself
 * rejects a command on a read-only replica iff the command carries `CMD_WRITE`
 * — see `processCommand` in redis/src/server.c:
 *
 *   int is_write_command = (cmd_flags & CMD_WRITE) || ...
 *   if (server.masterhost && server.repl_slave_ro && !obey_client && is_write_command)
 *       rejectCommand(c, shared.roslaveerr);   // -READONLY You can't write against a read only replica.
 *
 * So a command is replica-safe iff it does NOT carry the `write` flag. A command
 * that carries neither `write` nor `readonly` (PING/INFO/admin/pubsub) is
 * replica-safe under this rule.
 *
 * Resolve-then-fallback: built-ins / known modules hit the generated table
 * (`meta.flags` present) → derived value wins. User scripts / functions /
 * unknown modules miss the table (`meta`/`meta.flags` absent) → fall back to the
 * hand-set `Command.IS_READ_ONLY`. No breaking change.
 */
export function isReplicaSafe(
  meta: CommandMetadata | undefined,
  fallback: boolean | undefined
): boolean {
  return meta?.flags ? !meta.flags.includes('write') : !!fallback;
}

/**
 * Whether a command's reply is eligible for client-side caching (CSC).
 *
 * Implements the cross-client CSC "Command Eligibility" algorithm: a command is
 * cacheable if all of the following hold —
 *   - no `dont_cache` tip (explicit negative override),
 *   - has the `readonly` flag,
 *   - takes at least one key-name argument (`!isKeyless`; CSC invalidation is
 *     key-tracking based, so keyless read-only commands like KEYS must not cache),
 *   - no `nondeterministic_output` tip (value nondeterminism; `*_output_order`
 *     is fine — HGETALL/SMEMBERS stay cacheable),
 *   - no `script` / `script_runner` flag (EVAL_RO/EVALSHA_RO/FCALL_RO).
 *
 * Resolve-then-fallback: table miss (no `meta.flags`) falls back to the hand-set
 * `Command.CACHEABLE`.
 */
export function isCacheable(
  meta: CommandMetadata | undefined,
  fallback: boolean | undefined
): boolean {
  if (!meta?.flags) return !!fallback;
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
