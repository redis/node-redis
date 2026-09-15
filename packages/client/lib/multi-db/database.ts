import type { EventEmitter } from 'node:events';
import type { RedisClientLike } from './index';
import type { Circuit } from './circuit';

/**
 * ACTIVE receives all forwarded traffic; PASSIVE is a standby not selected
 * for traffic (possibly still connecting — health is the circuit's concern,
 * not the role's); DISCONNECTED means the member's client has ended.
 * @experimental
 */
export type DatabaseRole = 'ACTIVE' | 'PASSIVE' | 'DISCONNECTED';

export interface DatabaseOptions<C extends RedisClientLike> {
  id: string;
  client: C;
  weight: number;
  circuit: Circuit;
  skipInitialHealthCheck?: boolean;
  /** see MemberAdapter.untypedErrorIsFault - default true */
  untypedErrorIsFault?: boolean;
}

/**
 * Manager-side observation points for member lifecycle signals — the failure
 * detector feed and failover triggers attach here.
 */
export interface DatabaseHooks<C extends RedisClientLike> {
  /**
   * Client-level error (socket/decoder errors, reconnects, per-node errors).
   * `countsAsFault` separates fault EVIDENCE from observability: only
   * data-path errors may feed the failure detector, while every error is
   * still re-emitted as `member-error`.
   */
  onError?: (db: Database<C>, err: Error, countsAsFault: boolean) => void;
  /** client permanently ended — circuit already opened, role already DISCONNECTED */
  onDown?: (db: Database<C>) => void;
  /** client (re-)ready */
  onReady?: (db: Database<C>) => void;
}

/**
 * One member database: the underlying client bound to its stable id, weight,
 * circuit and role, feeding the client's lifecycle events into both.
 *
 * Signal mapping per member kind: standalone and pool clients re-emit socket
 * errors as `error`; cluster clients aggregate node errors into `error`, so a
 * single unreachable shard surfaces as command failures and opens the member
 * circuit only at detector thresholds; sentinel clients report per-node
 * errors as `client-error`, of which only MASTER connectivity counts as fault
 * evidence (replica/sentinel-node/pub-sub-proxy errors are tolerated by a
 * healthy deployment and surface as `member-error` only). Sentinels handle
 * their own master changes internally — the default detector thresholds
 * absorb that transient blip, so a sentinel-internal failover does not open
 * the member circuit. `end` means the client gave up reconnecting.
 */
export class Database<C extends RedisClientLike> {
  readonly id: string;
  readonly client: C;
  weight: number;
  readonly circuit: Circuit;
  role: DatabaseRole = 'PASSIVE';
  readonly skipInitialHealthCheck: boolean;
  readonly #untypedErrorIsFault: boolean;

  readonly #hooks: DatabaseHooks<C>;

  // Member clients are invisible to the user, so an unhandled `error` event
  // would crash the process — this listener must exist for the member's
  // whole lifetime.
  readonly #onError = (err: Error) => {
    // the client's own 'error' IS the data path (standalone/pool socket,
    // cluster node aggregate) — always fault evidence
    this.#hooks.onError?.(this, err, this.#untypedErrorIsFault);
  };

  readonly #onClientError = (event: { type?: string; error: Error }) => {
    // sentinel per-node errors: only MASTER connectivity is the data path.
    // A healthy deployment tolerates dead replicas, lost sentinel nodes and
    // pub/sub-proxy reconnects by design — those must never accumulate into
    // a failover, but they still surface as member-error.
    this.#hooks.onError?.(this, event.error, event.type === 'MASTER');
  };

  readonly #onReady = () => {
    if (this.role === 'DISCONNECTED') {
      this.role = 'PASSIVE';
    }
    this.#hooks.onReady?.(this);
  };

  readonly #onEnd = () => {
    this.role = 'DISCONNECTED';
    this.circuit.open();
    this.#hooks.onDown?.(this);
  };

  constructor(options: DatabaseOptions<C>, hooks: DatabaseHooks<C> = {}) {
    this.id = options.id;
    this.client = options.client;
    this.weight = options.weight;
    this.circuit = options.circuit;
    this.skipInitialHealthCheck = options.skipInitialHealthCheck ?? false;
    this.#untypedErrorIsFault = options.untypedErrorIsFault ?? true;
    this.#hooks = hooks;

    (this.client as unknown as EventEmitter)
      .on('error', this.#onError)
      .on('client-error', this.#onClientError)
      .on('ready', this.#onReady)
      .on('end', this.#onEnd);
  }

  /**
   * Detach lifecycle listeners — call only after the client is closed or
   * destroyed: this removes the member's only `error` listener, so detaching
   * it from a live client lets the next `error` event crash the process
   * (`manager.ts:MultiDbManager.close`/`destroy` order depends on this).
   */
  dispose(): void {
    (this.client as unknown as EventEmitter)
      .off('error', this.#onError)
      .off('client-error', this.#onClientError)
      .off('ready', this.#onReady)
      .off('end', this.#onEnd);
  }
}
