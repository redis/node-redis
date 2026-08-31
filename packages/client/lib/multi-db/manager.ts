import type { RedisArgument, ReplyUnion } from '../RESP/types';
import type { AnyRedisClientType } from './index';
import type { MultiDbController, FailoverReason } from './controller';
import type { ResolvedMultiDbConfig, ResolvedDatabaseIdentity, PoolDatabaseConfig, InitialAvailability } from './config';
import { resolveDatabaseIdentity } from './config';
import { Circuit } from './circuit';
import { Database } from './database';
import type { HealthCheck, HealthCheckTarget } from './health-check';
import { DefaultHealthCheck, runProbeRound, probeRoundBudget, withTimeout } from './health-check';

/**
 * Topology-specific hooks the manager needs for each member kind; each factory
 * supplies one so the manager stays client-kind agnostic.
 */
export interface MemberAdapter<C extends AnyRedisClientType> {
  /** builds one member client from its database config */
  create(config: PoolDatabaseConfig<unknown>): C;
  /** keyless command dispatch — health-check probes route through this */
  sendCommand(client: C, args: Array<RedisArgument>): Promise<ReplyUnion>;
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
  #events?: Pick<MultiDbController<C>, 'emit'>;

  constructor(
    members: Array<ResolvedMemberConfig>,
    config: ResolvedMultiDbConfig,
    adapter: MemberAdapter<C>
  ) {
    this.#config = config;
    this.#adapter = adapter;
    this.#healthChecks = config.healthChecks ?? [new DefaultHealthCheck()];
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

  /** @internal the controller registers itself as the manager's event outlet
   * from its constructor (`controller.ts:MultiDbController`). Anything emitted
   * before that is silently dropped — don't emit from the manager constructor.
   */
  bindEvents(events: Pick<MultiDbController<C>, 'emit'>): void {
    this.#events = events;
  }

  /**
   * Hook point on the command hot path: `index.ts:attachForwarders` reports
   * the settled outcome of each promise-returning forwarded method call here.
   * Getter-forwarded namespaces (`json.*`) and non-promise returns (`multi()`)
   * bypass this feed. The default failure detector consumes it (US1).
   */
  onCommandResult(_ok: boolean, _err?: Error): void {
    // detector wiring lands with US1 (T018/T020)
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

    if (reason === 'fallback') {
      this.#events?.emit('fallback', { from: from.id, to: target.id });
    } else {
      this.#events?.emit('failover', { from: from.id, to: target.id, reason });
    }

    this.#afterSwitch(from, target).catch(err => this.#events?.emit('error', err));
  }

  async #afterSwitch(_from: Database<C>, _to: Database<C>): Promise<void> {
    // pub/sub transfer (T021) and OPEN-member teardown policy land with US1+
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

    const target = this.#selectByWeight(healthy)!;
    if (this.#active !== target) {
      // an ended member is already DISCONNECTED — don't demote it to PASSIVE
      if (this.#active.role === 'ACTIVE') {
        this.#active.role = 'PASSIVE';
      }
      this.#active = target;
      target.role = 'ACTIVE';
    }
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
      const candidates = this.#databases.filter(db => db !== member && db.circuit.state === 'CLOSED');
      const target = this.#selectByWeight(candidates);
      if (!target) {
        throw new Error(`MultiDb: cannot remove active database "${id}", no healthy replacement`);
      }
      this.switchTo(target, 'active-removed');
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

  /** highest weight wins, earlier config position breaks ties (strict `>` keeps the first) */
  #selectByWeight(candidates: ReadonlyArray<Database<C>>): Database<C> | undefined {
    let best: Database<C> | undefined;
    for (const db of candidates) {
      if (!best || db.weight > best.weight) {
        best = db;
      }
    }
    return best;
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
