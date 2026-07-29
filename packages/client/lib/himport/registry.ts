import { RedisArgument } from '../RESP/types';

/**
 * Client-side bookkeeping for the HIMPORT command family (hinted hash templates, Redis 8.10).
 *
 * Server-side fieldsets are session state attached to one physical connection: they die on
 * disconnect and RESET, and no other connection can see them. The client therefore keeps two
 * layers of state:
 *
 * - {@link FieldsetRegistry} — one per logical client (standalone client, pool, cluster,
 *   sentinel), shared by every `RedisClient` the logical client owns. It records what the
 *   user *registered* (`hImportPrepare`) and is the replay source for transparently
 *   re-preparing connections.
 * - {@link PreparedFieldsets} — one per `RedisClient`, never shared. It mirrors what that
 *   client's *current socket session* actually holds, so the lazy-prepare hook can decide
 *   whether an `HIMPORT SET` needs a `PREPARE` pipelined in front of it.
 *
 * TODO(himport-multi) — auto-prepare inside MULTI/pipeline. The multi queue stores raw args
 * only (`multi-command.ts`) — no `Command` identity survives. Recipe when picked up: in
 * `_executeMulti` sniff HIMPORT SET raw args (Buffer-tolerant compare of args[0]/args[1]) and
 * inject PREPAREs under the same `chainId` BEFORE the `['MULTI']` (fieldsets are
 * session-level — the PREPARE need not be inside the transaction); keep injected promises out
 * of the positional result mapping (`transformReplies` uses only the last reply); same
 * treatment in `_executePipeline`. Needs aborted-EXEC registry bookkeeping thought through.
 * Until then: inside MULTI the fieldset must already exist on that connection (prepare
 * beforehand outside the MULTI) — documented. The session-subcommand reject guard already
 * scans queued commands at the same funnel; when this TODO is picked up, revisit whether that
 * reject should become a registry-mirroring sniff instead.
 */

export interface Fieldset {
  /**
   * The field names exactly as the caller passed them to `hImportPrepare` — never deduped,
   * sorted, or reordered (the server pairs SET values to this order positionally).
   */
  fields: Array<RedisArgument>;
  /**
   * Staleness token from the registry-wide monotonic counter. A connection whose
   * `PreparedFieldsets` entry holds a lower number must re-PREPARE before its next SET.
   */
  version: number;
}

/**
 * What the user registered on the logical client: fieldset name → ordered field list.
 * Single source of truth for lazy re-prepare; also the source of the registry-based
 * DISCARD/DISCARDALL replies. Mutated only by the per-connection command hook.
 */
export class FieldsetRegistry {
  /** Fieldset name → registration, keyed by the `String()`-coerced name. */
  #fieldsets = new Map<string, Fieldset>();

  /** Source of `Fieldset.version` — registry-wide and never reset. */
  #versionCounter = 0;

  /**
   * Counts effective discards only (discarding an unknown name does not bump). Connections
   * compare their `syncedDiscardCount` snapshot against this to detect pending discards.
   */
  discardCount = 0;

  /**
   * Idempotent upsert: registering the same name with a deep-equal field list keeps the
   * existing version (cluster fan-out and per-worker startup prepares must not churn
   * versions); a new name or a changed field list gets the next counter value.
   */
  set(name: string, fields: Array<RedisArgument>): void {
    const key = String(name);
    const existing = this.#fieldsets.get(key);
    if (existing !== undefined && fieldsEqual(existing.fields, fields)) return;
    this.#fieldsets.set(key, {
      fields: fields.slice(),
      version: ++this.#versionCounter
    });
  }

  get(name: string): Fieldset | undefined {
    return this.#fieldsets.get(String(name));
  }

  /**
   * Returns `true` iff the name was registered — this boolean IS the user-facing
   * `hImportDiscard` reply (registry-based, not the server session's).
   */
  discard(name: string): boolean {
    const removed = this.#fieldsets.delete(String(name));
    if (removed) this.discardCount++;
    return removed;
  }

  /**
   * Returns the number of registrations removed — this count IS the user-facing
   * `hImportDiscardAll` reply.
   */
  discardAll(): number {
    const removed = this.#fieldsets.size;
    if (removed > 0) {
      this.#fieldsets.clear();
      this.discardCount++;
    }
    return removed;
  }

  /**
   * Names the session still holds but the registry no longer does — the discards that
   * connection has yet to replay.
   */
  diff(sessionNames: Set<string>): Set<string> {
    const pending = new Set<string>();
    for (const name of sessionNames) {
      if (!this.#fieldsets.has(name)) pending.add(name);
    }
    return pending;
  }
}

/**
 * What one `RedisClient`'s current socket session holds. Every entry is a CLAIM about
 * server-side session state, not client state: it is tied to the socket's lifetime, so the
 * client wipes this whole object on socket error, `reset()`, and socket replacement. A claim
 * that survives an unenumerated loss path lies — the `no such fieldset` recover-and-retry
 * net heals that at the cost of one extra round trip.
 */
export class PreparedFieldsets {
  /**
   * Fieldset name → the {@link Fieldset.version} this session was prepared with. A missing
   * entry or a lower version means the next dependent command must pipeline a PREPARE first.
   */
  #versions = new Map<string, number>();

  /**
   * Snapshot of `FieldsetRegistry.discardCount` this connection has reconciled up to.
   * `syncedDiscardCount < registry.discardCount` means discards happened that this session
   * may still hold — reconcile before the next HIMPORT command. Knocked back when an
   * injected DISCARD fails, so the reconcile re-runs.
   */
  syncedDiscardCount = 0;

  get(name: string): number | undefined {
    return this.#versions.get(name);
  }

  set(name: string, version: number): void {
    this.#versions.set(name, version);
  }

  delete(name: string): boolean {
    return this.#versions.delete(name);
  }

  names(): Set<string> {
    return new Set(this.#versions.keys());
  }

  /** Live view over the session claims — snapshot (`new Map(entries())`) before mutating. */
  entries(): IterableIterator<[string, number]> {
    return this.#versions.entries();
  }

  get size(): number {
    return this.#versions.size;
  }

  clear(): void {
    this.#versions.clear();
  }
}

/**
 * Element-wise, byte-level equality: a `Buffer` and a `string` with identical bytes are
 * equal. Byte-level matters because the idempotency decision must match what the wire would
 * carry, not the JS representation.
 */
function fieldsEqual(a: Array<RedisArgument>, b: Array<RedisArgument>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (typeof x === 'string' && typeof y === 'string') {
      if (x !== y) return false;
    } else {
      const xb = typeof x === 'string' ? Buffer.from(x) : x;
      const yb = typeof y === 'string' ? Buffer.from(y) : y;
      if (!xb.equals(yb)) return false;
    }
  }
  return true;
}
