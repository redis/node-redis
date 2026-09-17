import { setTimeout as delay } from 'node:timers/promises';
import type { RedisArgument, ReplyUnion } from '../RESP/types';
import type { RedisClientLike } from './index';
import type { FailoverReason } from './events';
import type { ResolvedMultiDbConfig, ResolvedDatabaseIdentity, PoolDatabaseConfig, InitialAvailability } from './config';
import { resolveDatabaseIdentity, isFailureDetector, MAX_TIMER_MS } from './config';
import { Circuit } from './circuit';
import { Database } from './database';
import type { HealthCheck, HealthCheckTarget } from './health-check';
import { DefaultHealthCheck, runProbeRound, runSingleProbe, probeRoundBudget, withTimeout } from './health-check';
import type { FailureDetector } from './failure-detector';
import { DefaultFailureDetector } from './failure-detector';
import type { FailoverStrategy } from './failover-strategy';
import { WeightBasedStrategy } from './failover-strategy';
import { TemporarilyUnavailableError, PermanentlyUnavailableError, CommandAbandonedError } from './errors';

/**
 * Topology-specific hooks the manager needs for each member kind; each factory
 * supplies one so the manager stays client-kind agnostic.
 */
export interface MemberAdapter<C extends RedisClientLike> {
  /** builds one member client from its database config */
  create(config: PoolDatabaseConfig<unknown>): C;
  /** keyless command dispatch — health-check probes route through this */
  sendCommand(client: C, args: Array<RedisArgument>): Promise<ReplyUnion>;
  /**
   * Move pub/sub subscriptions from the old to the new active member after a
   * switch: detach every listener from `from` (so a recovering old member does
   * not double-deliver) and re-subscribe them on `to`. Implementations MUST
   * hand the listeners into `to`'s own extractable state before their first
   * await — switches don't wait for each other, so a second failover may
   * re-extract from `to` while this move's wire work is still in flight.
   * `isCurrent()` reports whether this is still the latest switch; any
   * DESTRUCTIVE cleanup of `from` after an await must be gated on it, or a
   * rapid switch-back (A→B→A) lets a stale move tear down a re-promoted
   * member. Omit when the topology does not support cross-member transfer —
   * the switch then leaves subscriptions behind instead of duplicating
   * deliveries.
   */
  movePubSub?(from: C, to: C, isCurrent: () => boolean): Promise<void>;
  /**
   * Called synchronously when traffic switches away from `from`: reject
   * commands still queued UNSENT on it when its connection is down, so they
   * fail to their callers now instead of replaying on the demoted member when
   * it reconnects. A ready member's queue drains normally — leave it alone.
   * Omit when the kind has no reachable unsent queue.
   */
  rejectQueued?(from: C, error: Error): void;
  /**
   * Whether the member kind's untyped 'error' events are fault EVIDENCE
   * (default true — for standalone/pool/cluster the 'error' channel IS the
   * data path). The sentinel adapter sets false: its public 'error' mixes
   * node passthrough, observe-loop and pub/sub-proxy noise that a healthy
   * deployment tolerates; sentinel fault evidence is the MASTER-typed
   * client-error channel, 'end', command outcomes and health checks.
   */
  untypedErrorIsFault?: boolean;
}

/** One member's resolved config as the manager consumes it. */
export type ResolvedMemberConfig = PoolDatabaseConfig<unknown> & ResolvedDatabaseIdentity;

/**
 * Where the manager's events land — the wrapper client
 * (`index.ts:makeClient` binds it). `listenerCount` backs the guarded
 * 'error' emit: EventEmitter throws on 'error' with zero listeners.
 */
export interface MultiDbEventOutlet {
  emit(event: string, ...args: Array<unknown>): boolean;
  listenerCount(event: string): number;
}

export type SwitchReason = FailoverReason | 'fallback';

function requiredHealthy(policy: InitialAvailability, total: number): number {
  switch (policy) {
    case 'ALL': return total;
    case 'MAJORITY': return Math.floor(total / 2) + 1;
    case 'ONE': return 1;
  }
}

/**
 * Owns the member set and the active selection; orchestrates switches.
 * Internal — reached only through the factories and the controller.
 */
export class MultiDbManager<C extends RedisClientLike> {
  readonly #databases: Array<Database<C>>;
  #active: Database<C>;
  readonly #config: ResolvedMultiDbConfig;
  readonly #adapter: MemberAdapter<C>;
  readonly #healthChecks: ReadonlyArray<HealthCheck>;
  readonly #detector: FailureDetector;
  readonly #strategy: FailoverStrategy;
  /** non-null while no healthy member can serve traffic; 'failed' is terminal */
  #unavailable: 'searching' | 'failed' | null = null;
  /** single-winner guard: one failover procedure at a time */
  #failoverInFlight = false;
  /** forced selection: suspends auto-fallback until released or the member fails */
  #pinnedTo: Database<C> | null = null;
  /**
   * Watch session: the member that served the first WATCH, and whether a
   * switch has invalidated it. Watch state is connection-scoped and cannot
   * follow a failover, so a switch marks the session dirty and the next EXEC
   * rejects with WatchError (`index.ts:makePinnedMulti`) — mirroring the base
   * client's reconnect semantics and sentinel's dirty-watch on master change.
   * The app's standard retry loop then re-runs wholly on the new active
   * member. EXEC and UNWATCH clear the session.
   */
  watchedMember: Database<C> | null = null;
  watchDirty = false;
  /**
   * Sticky ref/unref intent, set by the wrapper's fan-out (`index.ts`): a
   * member added later must match — one ref'd socket would keep a process
   * alive that unref()'d the whole client. Applied only where the member kind
   * exposes ref/unref; not copied by duplicate() (runtime state).
   */
  refState: 'ref' | 'unref' | null = null;
  /**
   * Monotonic switch counter, bumped on every repoint. A switch's async
   * pub/sub handover captures it and skips destructive `from` cleanup once a
   * newer switch has happened — the root guard against a stale move acting on
   * re-promoted state (e.g. a rapid A→B→A).
   */
  #switchGeneration = 0;
  /** one forced switch at a time — setActiveDatabase rejects re-entry */
  #forcedSwitchInFlight = false;
  readonly #teardown = new AbortController();
  #events?: MultiDbEventOutlet;
  readonly #healthTimers = new Map<Database<C>, NodeJS.Timeout>();
  /** originating config per live member — the source of truth for duplicate() */
  readonly #memberConfigs = new Map<Database<C>, ResolvedMemberConfig>();
  /** per-member overlap guard: a probe round may outlast the check interval */
  readonly #probing = new Set<Database<C>>();
  #fallbackTimer?: NodeJS.Timeout;
  #autoFallbackInterval: number;
  /** background checks start with the first successful connect() */
  #schedulerRunning = false;
  /**
   * True once connect() has ever reached 'ready'. A rejected INITIAL connect
   * must destroy every member (documented contract); a rejected REPEAT/recovery
   * connect on a client that has served must NOT — a failed re-probe cannot be
   * allowed to tear down members that are currently fine.
   */
  #everReady = false;

  constructor(
    members: Array<ResolvedMemberConfig>,
    config: ResolvedMultiDbConfig,
    adapter: MemberAdapter<C>
  ) {
    this.#config = config;
    this.#adapter = adapter;
    this.#healthChecks = config.healthChecks ?? [new DefaultHealthCheck()];
    const detectorSource = config.failureDetector;
    if (typeof detectorSource === 'function') {
      // one fresh instance per manager — this is what makes duplicate() safe
      // with custom detectors
      const detector = detectorSource();
      if (!isFailureDetector(detector)) {
        throw new TypeError('MultiDb: the failureDetector factory must return a failure detector');
      }
      this.#detector = detector;
    } else {
      this.#detector = isFailureDetector(detectorSource)
        ? detectorSource
        : new DefaultFailureDetector(detectorSource);
    }
    this.#strategy = config.failoverStrategy ?? new WeightBasedStrategy();
    this.#autoFallbackInterval = config.autoFallbackInterval;
    this.#databases = members.map(member => this.#wrapMember(member));
    // provisional until connect() selects by weight among healthy members
    this.#active = this.#databases[0];
    this.#active.role = 'ACTIVE';
  }

  get databases(): ReadonlyArray<Database<C>> {
    return this.#databases;
  }

  get activeDatabase(): Database<C> {
    return this.#active;
  }

  /**
   * read at CALL time by every forwarder closure (`index.ts:attachForwarders`)
   * — must stay a live, uncached read of `#active`: caching would pin
   * forwarded commands to the old member across `switchTo`
   */
  get active(): C {
    return this.#active.client;
  }

  get config(): ResolvedMultiDbConfig {
    return this.#config;
  }

  /**
   * Non-null while no healthy member can serve traffic. Read by every
   * forwarder closure (`index.ts:attachForwarders`) before dispatch; a fresh
   * error per read keeps stack traces meaningful.
   */
  get unavailableError(): Error | undefined {
    if (this.#unavailable === null) return undefined;
    return this.#unavailable === 'failed'
      ? new PermanentlyUnavailableError(this.#config.maxFailoverAttempts)
      : new TemporarilyUnavailableError();
  }

  /** @internal the wrapper client registers itself as the manager's event
   * outlet at construction (`index.ts:makeClient`). Anything emitted before
   * that is silently dropped — don't emit from the manager constructor.
   */
  bindEvents(events: MultiDbEventOutlet): void {
    this.#events = events;
  }

  /**
   * Background-error outlet: EventEmitter throws on 'error' with zero
   * listeners, and these emits run inside promise handlers where the throw
   * would become an unhandled rejection and kill the process. Housekeeping
   * failures degrade to silence instead — an 'error' listener is optional.
   */
  #emitError(err: Error): void {
    if (this.#events && this.#events.listenerCount('error') > 0) {
      this.#events.emit('error', err);
    }
  }

  /**
   * Strategy dispatch: strategies see the narrow FailoverCandidate view and
   * must return one of the given candidates by contract — identity in,
   * identity out — so the result widens back to the live member safely. A
   * foreign object would corrupt the active selection, hence the check.
   */
  #select(candidates: ReadonlyArray<Database<C>>): Database<C> | undefined {
    const picked = this.#strategy.select(candidates);
    if (picked === undefined) return undefined;
    if (!candidates.includes(picked as Database<C>)) {
      throw new TypeError('MultiDb: a failover strategy must return one of the given candidates');
    }
    return picked as Database<C>;
  }

  /**
   * #select for the background paths (fallback timer, failure handling, the
   * all-down search): user strategy code throwing there would surface as an
   * uncaughtException or unhandled rejection and kill the process — or strand
   * #failoverInFlight forever. Degrade to "no candidate" and report through
   * the guarded error outlet instead. connect() and removeDatabase keep the
   * raw #select: they have callers to reject to.
   */
  #trySelect(candidates: ReadonlyArray<Database<C>>): Database<C> | undefined {
    try {
      return this.#select(candidates);
    } catch (err) {
      this.#emitError(err as Error);
      return undefined;
    }
  }

  /**
   * Command hot path: `index.ts:attachForwarders` reports the settled outcome
   * of each promise-returning forwarded method call here — plain commands and
   * namespace commands (`json.*`, wrapped per `index.ts:wrapNamespace`) alike —
   * and member lifecycle errors arrive through the same feed. Non-promise
   * returns (`multi()`, scan iterators) still bypass it. Outcomes attributed
   * to a member that is no longer active are dropped — in-flight commands
   * rejecting after a switch must not count against the new active member.
   * Trips the failover procedure when the detector declares the active member
   * faulty.
   */
  onCommandResult(ok: boolean, err?: Error, source?: Database<C>): void {
    if (source !== undefined && source !== this.#active) return;
    this.#detector.onCommandResult(ok, err);
    if (!ok && this.#detector.isFaulty()) {
      this.#handleActiveFailure(err ?? new Error('MultiDb: active database declared faulty'), 'failure-detector');
    }
  }

  /**
   * Switch primitive: atomically repoint the active member. The repoint is a
   * single synchronous assignment — forwarder closures observe it immediately,
   * and commands issued after it ride the new member's own offline queue if it
   * is mid-reconnect. Old-member housekeeping runs asynchronously and is never
   * awaited — synchronous teardown on switch is a known defect in other clients.
   */
  switchTo(target: Database<C>, reason: SwitchReason): void {
    const from = this.#active;
    if (target === from) return;

    this.#repoint(from, target);

    // the pub/sub handover runs BEFORE the announcement: adapters seed the
    // target's listener maps synchronously, so a listener reacting to the
    // event sees complete subscription state — emitted first, its
    // unsubscribe would hit an empty map and be resurrected by the move
    this.#afterSwitch(from, target).catch(err => this.#emitError(err as Error));

    if (reason === 'fallback') {
      this.#events?.emit('fallback', { from: from.id, to: target.id });
    } else {
      this.#events?.emit('failover', { from: from.id, to: target.id, reason });
    }
  }

  /**
   * The housekeeping every repoint needs — shared by switchTo and connect()'s
   * recovery re-selection, which must not differ in anything but the
   * announcement (a recovery announces 'ready', not 'failover'). The pub/sub
   * move stays with the callers (#afterSwitch): it is the one asynchronous
   * piece, and each caller owns its error routing.
   */
  #repoint(from: Database<C>, target: Database<C>): void {
    // every repoint advances the generation — a prior switch's in-flight
    // pub/sub handover reads this to know it has been superseded
    this.#switchGeneration++;

    // any switch away from the pin means automatic behavior took over —
    // a pin never traps traffic on a failed member
    if (this.#pinnedTo !== null && target !== this.#pinnedTo) {
      this.#pinnedTo = null;
    }

    this.#active = target;
    // an ended member is already DISCONNECTED — don't demote it to PASSIVE
    if (from.role === 'ACTIVE') {
      from.role = 'PASSIVE';
    }
    target.role = 'ACTIVE';

    // detector observations must never span members
    this.#detector.reset();

    // watch state cannot follow the switch: invalidate the session so the
    // next EXEC fails with WatchError instead of committing unguarded
    if (this.watchedMember !== null && this.watchedMember !== target && !this.watchDirty) {
      this.watchDirty = true;
      // best-effort: release the abandoned watches on the demoted member —
      // UNWATCH clears both its server-side watches and its own watch epoch,
      // so an unrelated transaction after a later fallback to it cannot
      // spuriously abort. A member that is down cannot be cleaned here:
      // reconnect drops its server watches, but its client-side epoch
      // survives, so the first transaction after traffic returns to it may
      // abort once with a fail-safe WatchError.
      const abandoned = this.watchedMember.client as unknown as {
        isReady?: boolean;
        unwatch?: () => Promise<unknown>;
      };
      if (abandoned.isReady && typeof abandoned.unwatch === 'function') {
        abandoned.unwatch().catch(() => {
          // the member may drop mid-flight; the epoch guard covers the rest
        });
      }
    }

    // a dead member's unsent queue must fail now, to its callers — never
    // replay on the demoted member when it reconnects
    this.#adapter.rejectQueued?.(from.client, new CommandAbandonedError());
  }

  async #afterSwitch(from: Database<C>, to: Database<C>): Promise<void> {
    // subscriptions move with the traffic; messages published between the
    // repoint and the re-subscribe completing are lost
    const generation = this.#switchGeneration;
    await this.#adapter.movePubSub?.(
      from.client,
      to.client,
      () => this.#currentSwitch(generation)
    );
  }

  /**
   * The two re-validation guards every async manager method must consult after
   * an await, before mutating state or emitting — the whole point is that the
   * synchronous switch (`#repoint`), a teardown, or a membership change may
   * have moved the world while the await was parked. Kept as two distinct
   * dimensions on purpose: `#memberLive` for per-member work (is this member
   * still in the set and the client not torn down?), `#currentSwitch` for a
   * fire-and-forget switch tail (is this still the latest switch?). Folding
   * teardown into the generation counter would abort unrelated switch tails on
   * a benign add/remove and make "why did this abort" unreadable.
   */
  #memberLive(db: Database<C>): boolean {
    return !this.#teardown.signal.aborted && this.#databases.includes(db);
  }

  #currentSwitch(generation: number): boolean {
    return this.#switchGeneration === generation;
  }

  /**
   * Failover procedure: open the failed active's circuit, switch to the
   * strategy's pick, or — with no eligible member — gate all traffic behind
   * `unavailableError` and retry selection every
   * `delayBetweenFailoverAttempts` up to `maxFailoverAttempts` times before
   * going permanently unavailable.
   */
  #handleActiveFailure(cause: Error, reason: 'failure-detector' | 'health-check' | 'connection-ended'): void {
    if (this.#failoverInFlight || this.#unavailable === 'failed' || this.#teardown.signal.aborted) return;

    const failed = this.#active;
    failed.circuit.open();
    this.#events?.emit('database-unhealthy', { id: failed.id, cause });

    const target = this.#trySelect(this.#databases);
    if (target) {
      this.switchTo(target, reason);
      return;
    }

    // no switch will run rejectQueued for us: abandon the failed member's
    // unsent queue now, or it replays when the member reconnects — even after
    // 'terminated'. Covers the same-member recovery too, where switchTo's
    // target === from early-return would skip it.
    this.#adapter.rejectQueued?.(failed.client, new CommandAbandonedError());

    this.#failoverInFlight = true;
    this.#unavailable = 'searching';
    void this.#searchLoop(reason);
  }

  async #searchLoop(reason: 'failure-detector' | 'health-check' | 'connection-ended'): Promise<void> {
    const { maxFailoverAttempts, delayBetweenFailoverAttempts } = this.#config;
    for (let attempt = 1; attempt <= maxFailoverAttempts; attempt++) {
      this.#events?.emit('all-databases-down', { attempt, maxAttempts: maxFailoverAttempts });
      try {
        await delay(delayBetweenFailoverAttempts, undefined, { signal: this.#teardown.signal });
      } catch {
        return; // torn down mid-search
      }
      if (this.#unavailable !== 'searching') {
        return; // rescued mid-delay by a forced switch
      }
      // background recovery probing keeps running during the search — a member
      // whose circuit closes here is what makes an attempt succeed
      const target = this.#trySelect(this.#databases);
      if (target) {
        this.#unavailable = null;
        this.#failoverInFlight = false;
        this.switchTo(target, reason);
        return;
      }
    }
    // terminal: the client gave up, so background checking stops too
    this.#unavailable = 'failed';
    this.#failoverInFlight = false;
    this.#stopTimers();
    this.#events?.emit('terminated', { attempts: maxFailoverAttempts });
  }

  /**
   * Background health scheduler: one unref'd interval per member, the active
   * one included — under zero traffic the organic detector sees nothing, so
   * this is what catches a silently dead active member.
   */
  #startScheduler(): void {
    this.#schedulerRunning = true;
    for (const db of this.#databases) {
      this.#startMemberChecks(db);
    }
    this.#startFallbackTimer(this.#autoFallbackInterval);
  }

  #startMemberChecks(db: Database<C>): void {
    // membership check: a removeDatabase completing while addDatabase was
    // still establishing must not leave the removed member with a live timer
    if (!this.#databases.includes(db)) return;
    if (!this.#schedulerRunning || this.#healthTimers.has(db) || this.#teardown.signal.aborted) return;
    const timer = setInterval(() => {
      void this.#checkMember(db);
    }, this.#config.healthCheck.interval);
    timer.unref();
    this.#healthTimers.set(db, timer);
  }

  async #checkMember(db: Database<C>): Promise<void> {
    if (this.#probing.has(db) || this.#unavailable === 'failed' || this.#teardown.signal.aborted) return;
    this.#probing.add(db);
    try {
      switch (db.circuit.state) {
        case 'OPEN':
          return; // grace period: leave the member alone
        case 'HALF_OPEN':
          await this.#recoveryProbe(db);
          return;
        case 'CLOSED':
          if (!await runProbeRound(this.#targetFor(db), this.#healthChecks, this.#config.healthCheck, this.#teardown.signal)) {
            const cause = new Error(`MultiDb: database "${db.id}" failed its health check`);
            if (db === this.#active) {
              this.#handleActiveFailure(cause, 'health-check');
            } else if (db.circuit.open() && this.#memberLive(db)) {
              // no announcement for a member removed OR torn down while its
              // round was in flight — its id may already belong to a new member
              this.#events?.emit('database-unhealthy', { id: db.id, cause });
            }
          }
          return;
      }
    } catch (err) {
      this.#emitError(err as Error);
    } finally {
      this.#probing.delete(db);
    }
  }

  /**
   * Recovery probing for a HALF_OPEN member: feed up to `numProbes` single
   * probes into the circuit — it closes on the last consecutive success, any
   * failure reopens it with a fresh grace period.
   */
  async #recoveryProbe(db: Database<C>): Promise<void> {
    const { numProbes, delayBetweenProbes, timeout } = this.#config.healthCheck;
    for (let i = 0; i < numProbes; i++) {
      if (i > 0 && delayBetweenProbes > 0) {
        try {
          await delay(delayBetweenProbes, undefined, { signal: this.#teardown.signal });
        } catch {
          return; // torn down mid-round: don't hold the event loop on a dead timer
        }
      }
      if (this.#teardown.signal.aborted || db.circuit.state !== 'HALF_OPEN') return;
      const healthy = await runSingleProbe(this.#targetFor(db), this.#healthChecks, timeout);
      // re-validate after the probe await: a forced switch/connect may have
      // closed+activated this member, a teardown may have fired, or it may have
      // been removed. Acting now would reopen a live member's circuit
      // (probeFailed) or emit 'database-recovered' after 'end'.
      if (!this.#memberLive(db) || db.circuit.state !== 'HALF_OPEN') return;
      if (healthy) {
        if (db.circuit.probeSucceeded()) {
          this.#events?.emit('database-recovered', { id: db.id });
          return;
        }
      } else {
        db.circuit.probeFailed();
        return;
      }
    }
  }

  #startFallbackTimer(intervalMs: number): void {
    this.#stopFallbackTimer();
    if (!this.#schedulerRunning || intervalMs <= 0 || this.#teardown.signal.aborted) return;
    this.#fallbackTimer = setInterval(() => this.#maybeFallback(), intervalMs);
    this.#fallbackTimer.unref();
  }

  #stopFallbackTimer(): void {
    if (this.#fallbackTimer) {
      clearInterval(this.#fallbackTimer);
      this.#fallbackTimer = undefined;
    }
  }

  #maybeFallback(): void {
    if (this.#unavailable !== null || this.#pinnedTo !== null) return;
    const candidate = this.#trySelect(this.#databases);
    // strictly higher weight only: equal-weight members must not ping-pong
    if (candidate && candidate !== this.#active && candidate.weight > this.#active.weight) {
      this.switchTo(candidate, 'fallback');
    }
  }

  /**
   * Force the active member: the target must pass a health-check round now —
   * present reality overrides a stale OPEN circuit, so a verified target is
   * closed (and announced recovered) before the switch. The forced selection
   * pins until releasePin() or until automatic failover moves off the failed
   * pinned member. A successful force also rescues a client searching for a
   * healthy member.
   */
  async setActiveDatabase(id: string): Promise<void> {
    if (this.#teardown.signal.aborted) {
      throw new Error('MultiDb: the client is closed');
    }
    const target = this.#requireDatabase(id);
    if (this.#unavailable === 'failed') {
      throw new Error('MultiDb: the client is permanently unavailable');
    }
    // one forced switch at a time: the probe round below takes seconds, and a
    // second force racing it would run two switches back to back
    if (this.#forcedSwitchInFlight) {
      throw new Error('MultiDb: a forced switch is already in progress');
    }
    this.#forcedSwitchInFlight = true;
    try {
      await this.#forceActiveDatabase(id, target);
    } finally {
      this.#forcedSwitchInFlight = false;
    }
  }

  async #forceActiveDatabase(id: string, target: Database<C>): Promise<void> {
    if (!await runProbeRound(this.#targetFor(target), this.#healthChecks, this.#config.healthCheck)) {
      throw new Error(`MultiDb: cannot force database "${id}", it failed its health check`);
    }
    // the probe round takes seconds — a search exhausting meanwhile must fail
    // the force, not let it half-succeed against stopped schedulers; recovery
    // from 'failed' is connect()'s job. (The assertion defeats the narrowing
    // from the entry check — the await above lets the search loop mutate this.)
    const afterProbe = this.#unavailable as 'searching' | 'failed' | null;
    if (afterProbe === 'failed') {
      throw new Error('MultiDb: the client is permanently unavailable');
    }
    // the same await lets close() or removeDatabase(id) land mid-probe —
    // forcing a removed member would pin traffic on a client nothing monitors
    if (this.#teardown.signal.aborted) {
      throw new Error('MultiDb: the client is closed');
    }
    if (!this.#databases.includes(target)) {
      throw new TypeError(`MultiDb: no database with id "${id}"`);
    }

    if (target.circuit.close()) {
      this.#events?.emit('database-recovered', { id: target.id });
    }
    if (this.#unavailable === 'searching') {
      this.#unavailable = null;
      this.#failoverInFlight = false;
    }
    this.switchTo(target, 'forced');
    // after the switch: switching itself clears a previous pin
    this.#pinnedTo = target;
  }

  /** Resume automatic weight-based behavior after a forced pin. */
  releasePin(): void {
    this.#pinnedTo = null;
  }

  /** @internal EXEC and UNWATCH settle the watch session (`index.ts`). */
  clearWatchSession(): void {
    this.watchedMember = null;
    this.watchDirty = false;
  }

  /**
   * Enable, retune or disable (`false` or a non-positive interval) the
   * auto-fallback loop at runtime.
   */
  setAutoFallback(intervalMs: number | false): void {
    const interval = intervalMs === false ? -1 : intervalMs;
    // negated form also rejects NaN and Infinity — Node clamps out-of-range
    // interval delays to a 1ms hot loop (same bound as config resolution)
    if (!(interval >= -1 && interval <= MAX_TIMER_MS)) {
      throw new TypeError(`MultiDb: autoFallbackInterval must be a number within [-1, ${MAX_TIMER_MS}] or false, got ${intervalMs}`);
    }
    this.#autoFallbackInterval = interval;
    this.#startFallbackTimer(interval);
  }

  #stopTimers(): void {
    for (const timer of this.#healthTimers.values()) {
      clearInterval(timer);
    }
    this.#healthTimers.clear();
    this.#stopFallbackTimer();
    // stopped means stopped: without this, setAutoFallback() after permanent
    // failure or teardown would happily schedule a useless ticking timer
    this.#schedulerRunning = false;
  }

  /**
   * Fan-out connect with per-member initial health checks. Resolves only when
   * the `initialAvailability` policy is met and a weight-selected healthy
   * member is active; rejects otherwise, destroying every member — a rejected
   * instance must not be reused. On success, members that failed to establish
   * keep reconnecting per their own strategy with an OPEN circuit. Calling it
   * again re-probes and re-selects (the recovery path from permanent
   * unavailability); already-open members are not reconnected. Closed is
   * terminal: after close()/destroy() it rejects — a fresh start is
   * duplicate() or a new factory call.
   */
  async connect(): Promise<void> {
    if (this.#teardown.signal.aborted) {
      throw new Error('MultiDb: the client is closed');
    }
    this.#events?.emit('connect');
    // snapshot: results pair with THESE members — the controller can add or
    // remove members while the fan-out is in flight, and index-correlating
    // against the live array would shift outcomes onto the wrong members.
    // skipInitialHealthCheck is honored only on runtime add — every member is
    // probed at initial connect
    const members = [...this.#databases];
    const results = await Promise.all(
      members.map(db => this.#establishMember(db, false))
    );
    // a close()/destroy() landing during the establish await already tore
    // everything down — proceeding would emit 'ready' after 'end' and dispatch
    // repoint/movePubSub against disposed clients. close()/destroy() are terminal.
    if (this.#teardown.signal.aborted) {
      throw new Error('MultiDb: the client is closed');
    }
    // reconcile with the live set: members removed mid-connect drop out of
    // both sides of the availability ratio; members added mid-connect were
    // established by addDatabase itself and are not this gate's concern
    const alive = members.filter(db => this.#databases.includes(db));
    const healthy = members.filter((db, index) => results[index] && this.#databases.includes(db));

    const required = requiredHealthy(this.#config.initialAvailability, alive.length);
    if (healthy.length < required) {
      throw await this.#failConnect(new Error(
        `MultiDb: initial availability '${this.#config.initialAvailability}' requires ` +
        `${required}/${alive.length} healthy databases, got ${healthy.length}`
      ));
    }

    let target: Database<C> | undefined;
    try {
      target = this.#select(healthy);
    } catch (err) {
      // user strategy code throwing (or returning a foreign object) fails the
      // connect through the same contract
      throw await this.#failConnect(err as Error);
    }
    if (target === undefined) {
      // a detector trip racing the probe round can re-open a circuit between
      // establish and selection — reject per the contract, don't crash
      throw await this.#failConnect(new Error('MultiDb: no healthy database is selectable'));
    }
    if (this.#active !== target) {
      // a recovery re-selection is a switch in everything but the
      // announcement — the 'ready' below is its signal, not 'failover'.
      // Skipping the housekeeping here once replayed a demoted member's
      // unsent queue and stranded its subscriptions.
      const from = this.#active;
      this.#repoint(from, target);
      this.#afterSwitch(from, target).catch(err => this.#emitError(err as Error));
    }

    // a repeat connect() that succeeds lifts the all-down gate — a search loop
    // still mid-delay observes the state change as a rescue and exits
    this.#unavailable = null;
    this.#failoverInFlight = false;

    this.#startScheduler();
    // the logical readiness signal: policy met, an active member is serving —
    // fires on the initial connect and again on a recovery re-connect
    this.#everReady = true;
    this.#events?.emit('ready');
  }

  /**
   * Fail a connect(): destroy every member first ONLY when the client has
   * never served — an initial (or never-ready) connect that rejects must
   * leave nothing live, per the documented contract. A repeat/recovery
   * connect on a client that has already been ready must not be torn down by
   * a failed re-probe: reject and leave the live members serving.
   */
  async #failConnect(error: Error): Promise<Error> {
    if (!this.#everReady) {
      await this.destroy();
    }
    return error; // callers `throw await this.#failConnect(...)` so control flow narrows
  }

  /**
   * Add a member at runtime; resolves to its id once the member is connected
   * and (unless `skipInitialHealthCheck`) health-checked. The member reports
   * an OPEN circuit until it establishes — a member that fails to establish
   * stays in the set that way.
   */
  async addDatabase(config: PoolDatabaseConfig<unknown>): Promise<string> {
    // after close()/destroy() nothing would ever tear a new member down again
    if (this.#teardown.signal.aborted) {
      throw new Error('MultiDb: the client is closed');
    }
    const resolved = resolveDatabaseIdentity(config, this.#generateId(), this.#databases);

    const member = this.#wrapMember(resolved);
    // pre-open: while establishing (an event-loop yield) the member must not
    // be selectable as a failover/removal replacement nor report healthy
    member.circuit.open();
    this.#databases.push(member);
    // #establishMember closes the circuit once the member establishes
    await this.#establishMember(member, member.skipInitialHealthCheck);
    // re-validate after the establish await: a close()/destroy() landing
    // meanwhile already tore this member down — don't resolve an id for a dead
    // member. Teardown-only on purpose: a concurrent removeDatabase(member) is
    // a legitimate resolve (the member left the set), and #startMemberChecks
    // below already no-ops for a member no longer in #databases.
    if (this.#teardown.signal.aborted) {
      throw new Error('MultiDb: the client is closed');
    }
    this.#startMemberChecks(member);
    return member.id;
  }

  /**
   * Remove a member. Removing the active member first switches to the
   * highest-weight healthy replacement and throws when none exists; the last
   * member cannot be removed.
   */
  async removeDatabase(id: string): Promise<void> {
    const member = this.#requireDatabase(id);
    // state conditions are plain Errors (may clear after recovery); TypeError
    // stays reserved for malformed arguments like an unknown id
    if (this.#databases.length === 1) {
      throw new Error('MultiDb: cannot remove the last database');
    }

    if (member === this.#active) {
      const target = this.#select(this.#databases.filter(db => db !== member));
      if (!target) {
        throw new Error(`MultiDb: cannot remove active database "${id}", no healthy replacement`);
      }
      this.switchTo(target, 'active-removed');
    }

    // switchTo above synchronously emits 'failover'; a listener re-entering
    // removeDatabase(id) could splice this member out before we do, leaving
    // indexOf === -1 and splice(-1, 1) deleting the wrong member
    const index = this.#databases.indexOf(member);
    if (index === -1) return;
    const timer = this.#healthTimers.get(member);
    if (timer) {
      clearInterval(timer);
      this.#healthTimers.delete(member);
    }
    this.#databases.splice(index, 1);
    this.#memberConfigs.delete(member);
    try {
      if (member.circuit.state === 'CLOSED') {
        await member.client.close();
      } else {
        member.client.destroy();
      }
    } catch {
      // best-effort teardown: the member may have never connected
    }
    member.dispose();
  }

  /**
   * Replace one member in a single call; resolves to the new member's id.
   * With a different (or generated) id the new member is added FIRST and the
   * old one removed after — the member COUNT never drops (the replacement
 * may still be establishing; its circuit reflects its health). With the SAME id the old
   * member must go first (ids are unique), so the set transiently runs one
   * member short, and the same constraints as removeDatabase apply: not the
   * last member, and an active member needs a healthy replacement. If the
   * removal half fails after an add, both members remain — remove manually.
   */
  async replaceDatabase(id: string, config: PoolDatabaseConfig<unknown>): Promise<string> {
    if (this.#teardown.signal.aborted) {
      throw new Error('MultiDb: the client is closed');
    }
    this.#requireDatabase(id); // unknown ids fail before any mutation
    if (config.id === id) {
      // the remove-first ordering is forced by id uniqueness — validate the
      // new config BEFORE the removal, or a malformed one shrinks the set
      resolveDatabaseIdentity(config, id);
      await this.removeDatabase(id);
      return this.addDatabase(config);
    }
    const added = await this.addDatabase(config);
    await this.removeDatabase(id);
    return added;
  }

  setWeight(id: string, weight: number): void {
    const member = this.#requireDatabase(id);
    // the single validator owns the weight rule
    resolveDatabaseIdentity({ ...this.#memberConfigs.get(member)!, weight }, id);
    member.weight = weight;
  }

  async close(): Promise<void> {
    const firstTeardown = !this.#teardown.signal.aborted;
    // stop the search loop and mute failure handling before members start ending
    this.#teardown.abort();
    this.#stopTimers();
    await Promise.all(this.#databases.map(async db => {
      try {
        await db.client.close();
      } catch {
        // best-effort teardown: the member may have never connected
      }
      db.dispose();
    }));
    if (firstTeardown) this.#events?.emit('end');
  }

  destroy(): Promise<void> {
    const firstTeardown = !this.#teardown.signal.aborted;
    this.#teardown.abort();
    this.#stopTimers();
    // per-member, awaited: some kinds tear down asynchronously (sentinel) and
    // a rejection must never escape as an unhandled rejection; dispose only
    // after the member settles — it removes the member's only 'error'
    // listener, and detaching from a still-live client lets a late error
    // crash the process
    const done = Promise.all(this.#databases.map(async db => {
      try {
        await db.client.destroy();
      } catch {
        // best-effort teardown: the member may have never connected
      }
      db.dispose();
    })).then(() => {
      if (firstTeardown) this.#events?.emit('end');
    });
    return done;
  }

  async quit(): Promise<void> {
    await this.close();
  }

  #wrapMember(config: ResolvedMemberConfig): Database<C> {
    const member = new Database<C>({
      id: config.id,
      client: this.#adapter.create(config),
      weight: config.weight,
      skipInitialHealthCheck: config.skipInitialHealthCheck,
      untypedErrorIsFault: this.#adapter.untypedErrorIsFault,
      circuit: new Circuit({
        gracePeriod: this.#config.gracePeriod,
        numProbes: this.#config.healthCheck.numProbes
      })
    }, {
      // source attribution in onCommandResult keeps passive members' lifecycle
      // noise out of the detector; passives are the background checks' concern.
      // Every hook also re-emits as a member-* event with the id in the
      // payload (`events.ts:MultiDbClientEvents`) — ids may be reused after a
      // remove/add, so they never go into event names.
      onError: (db, err, countsAsFault) => {
        if (countsAsFault) {
          this.onCommandResult(false, err, db);
        }
        this.#events?.emit('member-error', { id: db.id, error: err });
      },
      onReady: db => {
        this.#events?.emit('member-ready', { id: db.id });
      },
      onDown: db => {
        this.#events?.emit('member-end', { id: db.id });
        // a definitive end (reconnection given up) fails the active immediately
        if (db === this.#active) {
          this.#handleActiveFailure(new Error(`MultiDb: database "${db.id}" connection ended`), 'connection-ended');
        } else if (!this.#teardown.signal.aborted && this.#databases.includes(db)) {
          // deliberate removals are spliced out first and must not announce
          this.#events?.emit('database-unhealthy', {
            id: db.id,
            cause: new Error(`MultiDb: database "${db.id}" connection ended`)
          });
        }
      }
    });
    this.#memberConfigs.set(member, config);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ref/unref exist only on some member kinds
    const client = member.client as any;
    if (this.refState !== null && typeof client[this.refState] === 'function') {
      client[this.refState]();
    }
    return member;
  }

  /**
   * @internal New manager over the CURRENT live member set (runtime adds and
   * removes included, current weights) and the same resolved config and
   * adapter. Runtime state — circuit states, the active selection, a forced
   * pin — is deliberately not copied: the duplicate starts fresh and
   * unconnected. `overrides` merge shallowly into every member's options, so
   * the clone stays homogeneous.
   */
  duplicate(overrides?: object): MultiDbManager<C> {
    const detector = this.#config.failureDetector;
    if (typeof detector !== 'function' && isFailureDetector(detector)) {
      // an instance is live shared state: both managers would pump one sliding
      // window and reset() it on their own switches
      throw new TypeError(
        'MultiDb: duplicate() with a custom failure detector instance would share its state across clients — ' +
        'pass a factory (() => FailureDetector) in failureDetector instead'
      );
    }
    const members = this.#databases.map(db => {
      const config = this.#memberConfigs.get(db)!;
      // overrides are user input — the merged member goes through the single
      // validator like any other config (e.g. emitInvalidate must not sneak in)
      return resolveDatabaseIdentity({
        ...config,
        weight: db.weight,
        options: overrides === undefined
          ? config.options
          : { ...(config.options as object | undefined), ...overrides }
      }, config.id);
    });
    return new MultiDbManager(members, this.#config, this.#adapter);
  }

  /** next free generated id — gaps from removals may be reused, ids stay unique within the live set */
  #generateId(): string {
    let n = this.#databases.length;
    while (this.#databases.some(db => db.id === `db-${n}`)) n++;
    return `db-${n}`;
  }

  #requireDatabase(id: string): Database<C> {
    const member = this.#databases.find(db => db.id === id);
    if (!member) {
      throw new TypeError(`MultiDb: no database with id "${id}"`);
    }
    return member;
  }

  #targetFor(db: Database<C>): HealthCheckTarget {
    return {
      id: db.id,
      sendCommand: args => this.#adapter.sendCommand(db.client, args)
    };
  }

  /**
   * Establish one member: connect (bounded by the probe-round budget — a
   * member mid-retry must not stall the caller) and run one health-check
   * round. Failure opens the circuit; the client keeps reconnecting per its
   * own strategy in the background.
   */
  async #establishMember(db: Database<C>, skipCheck: boolean): Promise<boolean> {
    const budget = probeRoundBudget(this.#config.healthCheck);
    // an already-open member (repeat connect(), pre-connected add) skips
    // straight to the probe round — its connect() would reject spuriously
    if (!db.client.isOpen) {
      try {
        const connectPromise = db.client.connect();
        // a late background failure must not become an unhandled rejection
        (connectPromise as Promise<unknown>).catch(() => {});
        await withTimeout(connectPromise as Promise<unknown>, budget);
      } catch {
        db.circuit.open();
        return false;
      }
    }

    if (!skipCheck && !await runProbeRound(this.#targetFor(db), this.#healthChecks, this.#config.healthCheck)) {
      db.circuit.open();
      return false;
    }
    // a probe-verified member must be selectable — without this, a member that
    // failed an earlier connect() keeps its OPEN circuit and the strategy can
    // never pick it on a repeat connect()
    db.circuit.close();
    return true;
  }
}
