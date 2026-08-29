import type { AnyRedisClientType } from './index';
import type { MultiDbController, FailoverReason } from './controller';
import type { ResolvedMultiDbConfig } from './config';
import { Circuit } from './circuit';
import { Database } from './database';

/** Everything the manager needs to wrap one already-constructed member client. */
export interface MemberSpec<C extends AnyRedisClientType> {
  id: string;
  client: C;
  weight: number;
  skipInitialHealthCheck: boolean;
}

export type SwitchReason = FailoverReason | 'fallback';

/**
 * Owns the member set and the active selection; orchestrates switches.
 * Internal — reached only through the factories and the controller.
 */
export class MultiDbManager<C extends AnyRedisClientType> {
  readonly #databases: Array<Database<C>>;
  #active: Database<C>;
  readonly #config: ResolvedMultiDbConfig;
  #events?: Pick<MultiDbController<C>, 'emit'>;

  constructor(members: Array<MemberSpec<C>>, config: ResolvedMultiDbConfig) {
    this.#config = config;
    this.#databases = members.map(member => new Database<C>({
      id: member.id,
      client: member.client,
      weight: member.weight,
      skipInitialHealthCheck: member.skipInitialHealthCheck,
      circuit: new Circuit({
        gracePeriod: config.gracePeriod,
        numProbes: config.healthCheck.numProbes
      })
    }));
    // weight-based initial selection lands with the initial-connection flow (T013)
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
   * @internal the controller registers itself as the manager's event outlet
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
   * bypass this feed (research R7). The default failure detector consumes it
   * (US1).
   */
  onCommandResult(_ok: boolean, _err?: Error): void {
    // detector wiring lands with US1 (T018/T020)
  }

  /**
   * Switch primitive: atomically repoint the active member. The repoint is a
   * single synchronous assignment — forwarder closures observe it immediately,
   * and commands issued after it ride the new member's own offline queue if it
   * is mid-reconnect (FR-023). Old-member housekeeping runs asynchronously and
   * is never awaited (research R5: synchronous teardown on switch is a known
   * defect in other clients).
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

  async connect(): Promise<void> {
    // initial health checks + `initialAvailability` gate land with US2 (T013)
    await Promise.all(this.#databases.map(db => db.client.connect()));
  }

  async close(): Promise<void> {
    await Promise.all(this.#databases.map(async db => {
      await db.client.close();
      db.dispose();
    }));
  }

  destroy(): void {
    for (const db of this.#databases) {
      db.client.destroy();
      db.dispose();
    }
  }

  async quit(): Promise<void> {
    await this.close();
  }
}
