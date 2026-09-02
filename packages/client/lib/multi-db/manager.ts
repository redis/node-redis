import { setTimeout as delay } from 'node:timers/promises';
import type { RedisArgument, ReplyUnion } from '../RESP/types';
import type { AnyRedisClientType } from './index';
import type { MultiDbController, FailoverReason } from './controller';
import type { ResolvedMultiDbConfig, ResolvedDatabaseIdentity, PoolDatabaseConfig, InitialAvailability } from './config';
import { resolveDatabaseIdentity, isFailureDetector } from './config';
import { Circuit } from './circuit';
import { Database } from './database';
import type { HealthCheck, HealthCheckTarget } from './health-check';
import { DefaultHealthCheck, runProbeRound, runSingleProbe, probeRoundBudget, withTimeout } from './health-check';
import type { FailureDetector } from './failure-detector';
import { DefaultFailureDetector } from './failure-detector';
import type { FailoverStrategy } from './failover-strategy';
import { WeightBasedStrategy } from './failover-strategy';
import { TemporarilyUnavailableError, PermanentlyUnavailableError } from './errors';

/**
 * Topology-specific hooks the manager needs for each member kind; each factory
 * supplies one so the manager stays client-kind agnostic.
 */
export interface MemberAdapter<C extends AnyRedisClientType> {
  /** builds one member client from its database config */
  create(config: PoolDatabaseConfig<unknown>): C;
  /** keyless command dispatch — health-check probes route through this */
  sendCommand(client: C, args: Array<RedisArgument>): Promise<ReplyUnion>;
  /**
   * Move pub/sub subscriptions from the old to the new active member after a
   * switch: detach every listener from `from` (so a recovering old member does
   * not double-deliver) and re-subscribe them on `to`. Omit when the topology
   * does not support cross-member transfer — the switch then leaves
   * subscriptions behind instead of duplicating deliveries.
   */
  movePubSub?(from: C, to: C): Promise<void>;
}

/** One member's resolved config as the manager consumes it. */
export type ResolvedMemberConfig = PoolDatabaseConfig<unknown> & ResolvedDatabaseIdentity;

export type SwitchReason = FailoverReason | 'fallback';

function requiredHealthy(policy: InitialAvailability, total: number): number {
  switch (policy) {
    case 'all': return total;
    case 'majority': return Math.floor(total / 2) + 1;
    case 'one': return 1;
  }
}

/**
 * Owns the member set and the active selection; orchestrates switches.
 * Internal — reached only through the factories and the controller.
 */
export class MultiDbManager<C extends AnyRedisClientType> {
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
  readonly #teardown = new AbortController();
  #events?: Pick<MultiDbController<C>, 'emit'>;
  readonly #healthTimers = new Map<Database<C>, NodeJS.Timeout>();
  /** per-member overlap guard: a probe round may outlast the check interval */
  readonly #probing = new Set<Database<C>>();
  #fallbackTimer?: NodeJS.Timeout;
  #autoFallbackInterval: number;
  /** background checks start with the first successful connect() */
  #schedulerRunning = false;

  constructor(
    members: Array<ResolvedMemberConfig>,
    config: ResolvedMultiDbConfig,
    adapter: MemberAdapter<C>
  ) {
    this.#config = config;
    this.#adapter = adapter;
    this.#healthChecks = config.healthChecks ?? [new DefaultHealthCheck()];
    this.#detector = isFailureDetector(config.failureDetector)
      ? config.failureDetector
      : new DefaultFailureDetector(config.failureDetector);
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

  /** @internal the controller registers itself as the manager's event outlet
   * from its constructor (`controller.ts:MultiDbController`). Anything emitted
   * before that is silently dropped — don't emit from the manager constructor.
   */
  bindEvents(events: Pick<MultiDbController<C>, 'emit'>): void {
    this.#events = events;
  }

  /**
   * Command hot path: `index.ts:attachForwarders` reports the settled outcome
   * of each promise-returning forwarded method call here, and member lifecycle
   * errors arrive through the same feed. Getter-forwarded namespaces (`json.*`)
   * and non-promise returns (`multi()`) bypass it. Outcomes attributed to a
   * member that is no longer active are dropped — in-flight commands rejecting
   * after a switch must not count against the new active member. Trips the
   * failover procedure when the detector declares the active member faulty.
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

    this.#active = target;
    // an ended member is already DISCONNECTED — don't demote it to PASSIVE
    if (from.role === 'ACTIVE') {
      from.role = 'PASSIVE';
    }
    target.role = 'ACTIVE';

    // detector observations must never span members
    this.#detector.reset();

    if (reason === 'fallback') {
      this.#events?.emit('fallback', { from: from.id, to: target.id });
    } else {
      this.#events?.emit('failover', { from: from.id, to: target.id, reason });
    }

    this.#afterSwitch(from, target).catch(err => this.#events?.emit('error', err));
  }

  async #afterSwitch(from: Database<C>, to: Database<C>): Promise<void> {
    // subscriptions move with the traffic; messages published between the
    // repoint and the re-subscribe completing are lost
    await this.#adapter.movePubSub?.(from.client, to.client);
  }

  /**
   * Failover procedure: open the failed active's circuit, switch to the
   * strategy's pick, or — with no eligible member — gate all traffic behind
   * `unavailableError` and retry selection every
   * `delayBetweenFailoverAttempts` up to `maxFailoverAttempts` times before
   * going permanently unavailable.
   */
  #handleActiveFailure(cause: Error, reason: 'failure-detector' | 'health-check'): void {
    if (this.#failoverInFlight || this.#unavailable === 'failed' || this.#teardown.signal.aborted) return;

    const failed = this.#active;
    failed.circuit.open();
    this.#events?.emit('database-unhealthy', { id: failed.id, cause });

    const target = this.#strategy.select(this.#databases);
    if (target) {
      this.switchTo(target, reason);
      return;
    }

    this.#failoverInFlight = true;
    this.#unavailable = 'searching';
    void this.#searchLoop(reason);
  }

  async #searchLoop(reason: 'failure-detector' | 'health-check'): Promise<void> {
    const { maxFailoverAttempts, delayBetweenFailoverAttempts } = this.#config;
    for (let attempt = 1; attempt <= maxFailoverAttempts; attempt++) {
      this.#events?.emit('all-databases-down', { attempt, maxAttempts: maxFailoverAttempts });
      try {
        await delay(delayBetweenFailoverAttempts, undefined, { signal: this.#teardown.signal });
      } catch {
        return; // torn down mid-search
      }
      // background recovery probing keeps running during the search — a member
      // whose circuit closes here is what makes an attempt succeed
      const target = this.#strategy.select(this.#databases);
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
          if (!await runProbeRound(this.#targetFor(db), this.#healthChecks, this.#config.healthCheck)) {
            const cause = new Error(`MultiDb: database "${db.id}" failed its health check`);
            if (db === this.#active) {
              this.#handleActiveFailure(cause, 'health-check');
            } else if (db.circuit.open()) {
              this.#events?.emit('database-unhealthy', { id: db.id, cause });
            }
          }
          return;
      }
    } catch (err) {
      this.#events?.emit('error', err as Error);
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
        await delay(delayBetweenProbes);
      }
      if (this.#teardown.signal.aborted || db.circuit.state !== 'HALF_OPEN') return;
      if (await runSingleProbe(this.#targetFor(db), this.#healthChecks, timeout)) {
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
    if (this.#unavailable !== null) return;
    const candidate = this.#strategy.select(this.#databases);
    // strictly higher weight only: equal-weight members must not ping-pong
    if (candidate && candidate !== this.#active && candidate.weight > this.#active.weight) {
      this.switchTo(candidate, 'fallback');
    }
  }

  /**
   * Enable, retune or disable (`false` or a non-positive interval) the
   * auto-fallback loop at runtime.
   */
  setAutoFallback(intervalMs: number | false): void {
    const interval = intervalMs === false ? -1 : intervalMs;
    // negated form also rejects NaN
    if (!(interval >= -1)) {
      throw new TypeError(`MultiDb: autoFallbackInterval must be a number or false, got ${intervalMs}`);
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
  }

  /**
   * Fan-out connect with per-member initial health checks. Resolves only when
   * the `initialAvailability` policy is met and a weight-selected healthy
   * member is active; rejects otherwise, destroying every member — a rejected
   * instance must not be reused. On success, members that failed to establish
   * keep reconnecting per their own strategy with an OPEN circuit. Calling it
   * again re-probes and re-selects; already-open members are not reconnected.
   */
  async connect(): Promise<void> {
    // skipInitialHealthCheck is honored only on runtime add — every member is
    // probed at initial connect
    const results = await Promise.all(
      this.#databases.map(db => this.#establishMember(db, false))
    );
    const healthy = this.#databases.filter((_, index) => results[index]);

    const required = requiredHealthy(this.#config.initialAvailability, this.#databases.length);
    if (healthy.length < required) {
      // a rejected connect() must not leave live sockets or retry timers behind
      this.destroy();
      throw new Error(
        `MultiDb: initial availability '${this.#config.initialAvailability}' requires ` +
        `${required}/${this.#databases.length} healthy databases, got ${healthy.length}`
      );
    }

    const target = this.#strategy.select(healthy)!;
    if (this.#active !== target) {
      // an ended member is already DISCONNECTED — don't demote it to PASSIVE
      if (this.#active.role === 'ACTIVE') {
        this.#active.role = 'PASSIVE';
      }
      this.#active = target;
      target.role = 'ACTIVE';
    }

    this.#startScheduler();
  }

  /**
   * Add a member at runtime; resolves to its id once the member is connected
   * and (unless `skipInitialHealthCheck`) health-checked. The member reports
   * an OPEN circuit until it establishes — a member that fails to establish
   * stays in the set that way.
   */
  async addDatabase(config: PoolDatabaseConfig<unknown>): Promise<string> {
    const resolved = resolveDatabaseIdentity(config, this.#generateId());
    if (this.#databases.some(db => db.id === resolved.id)) {
      throw new TypeError(`MultiDb: duplicate database id "${resolved.id}"`);
    }

    const member = this.#wrapMember(resolved);
    // pre-open: while establishing (an event-loop yield) the member must not
    // be selectable as a failover/removal replacement nor report healthy
    member.circuit.open();
    this.#databases.push(member);
    if (await this.#establishMember(member, member.skipInitialHealthCheck)) {
      member.circuit.close();
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
      const target = this.#strategy.select(this.#databases.filter(db => db !== member));
      if (!target) {
        throw new Error(`MultiDb: cannot remove active database "${id}", no healthy replacement`);
      }
      this.switchTo(target, 'active-removed');
    }

    const timer = this.#healthTimers.get(member);
    if (timer) {
      clearInterval(timer);
      this.#healthTimers.delete(member);
    }
    this.#databases.splice(this.#databases.indexOf(member), 1);
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

  setWeight(id: string, weight: number): void {
    // negated form also rejects NaN
    if (!(weight >= 0 && weight <= 1)) {
      throw new TypeError(`MultiDb: database "${id}" weight must be within [0, 1], got ${weight}`);
    }
    this.#requireDatabase(id).weight = weight;
  }

  async close(): Promise<void> {
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
  }

  destroy(): void {
    this.#teardown.abort();
    this.#stopTimers();
    for (const db of this.#databases) {
      try {
        db.client.destroy();
      } catch {
        // best-effort teardown: the member may have never connected
      }
      db.dispose();
    }
  }

  async quit(): Promise<void> {
    await this.close();
  }

  #wrapMember(config: ResolvedMemberConfig): Database<C> {
    return new Database<C>({
      id: config.id,
      client: this.#adapter.create(config),
      weight: config.weight,
      skipInitialHealthCheck: config.skipInitialHealthCheck,
      circuit: new Circuit({
        gracePeriod: this.#config.gracePeriod,
        numProbes: this.#config.healthCheck.numProbes
      })
    }, {
      // source attribution in onCommandResult keeps passive members' lifecycle
      // noise out of the detector; passives are the background checks' concern
      onError: (db, err) => this.onCommandResult(false, err, db),
      onDown: db => {
        // a definitive end (reconnection given up) fails the active immediately
        if (db === this.#active) {
          this.#handleActiveFailure(new Error(`MultiDb: database "${db.id}" connection ended`), 'failure-detector');
        } else if (!this.#teardown.signal.aborted && this.#databases.includes(db)) {
          // deliberate removals are spliced out first and must not announce
          this.#events?.emit('database-unhealthy', {
            id: db.id,
            cause: new Error(`MultiDb: database "${db.id}" connection ended`)
          });
        }
      }
    });
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
    return true;
  }
}
