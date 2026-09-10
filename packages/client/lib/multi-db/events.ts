/**
 * The multi-db wrapper's event surface. The wrapper (the drop-in client) is
 * the single event emitter of the feature: logical lifecycle about the client
 * as a whole, an optional aggregated `error`, the multi-db decision events,
 * and per-member `member-*` pass-throughs. The controller emits nothing.
 */

/** @experimental why an automatic switch happened */
export type FailoverReason = 'failure-detector' | 'health-check' | 'forced' | 'active-removed';

/**
 * Active switched `from` → `to` (database ids) because the active member
 * failed, was removed, or was forced.
 * @experimental
 */
export interface FailoverEvent {
  from: string;
  to: string;
  reason: FailoverReason;
}

/**
 * Auto-fallback returned traffic to a higher-weight healthy member.
 * @experimental
 */
export interface FallbackEvent {
  from: string;
  to: string;
}

/**
 * A member's circuit opened; `cause` is the error that tripped it.
 * @experimental
 */
export interface DatabaseUnhealthyEvent {
  id: string;
  cause: Error;
}

/**
 * A member's circuit closed again after recovery probing.
 * @experimental
 */
export interface DatabaseRecoveredEvent {
  id: string;
}

/**
 * One failed failover attempt while no eligible member exists; `attempt`
 * counts toward `maxFailoverAttempts`.
 * @experimental
 */
export interface AllDatabasesDownEvent {
  attempt: number;
  maxAttempts: number;
}

/**
 * The client became permanently unavailable: every failover attempt failed.
 * Only a later `connect()` recovers it.
 * @experimental
 */
export interface TerminatedEvent {
  /** failover attempts made before giving up */
  attempts: number;
}

/**
 * One member's client reported an error. Member ids may be reused after a
 * remove/add — read the id from the payload per event, never bind logic to an
 * id captured long ago.
 * @experimental
 */
export interface MemberErrorEvent {
  id: string;
  error: Error;
}

/** One member's client became ready (connected or reconnected). @experimental */
export interface MemberReadyEvent {
  id: string;
}

/** One member's client ended permanently (gave up reconnecting). @experimental */
export interface MemberEndEvent {
  id: string;
}

/**
 * Event name → listener argument tuple for the multi-db wrapper.
 *
 * Lifecycle events describe the LOGICAL client: `connect` fires when
 * establishment starts, `ready` when the availability policy is met and an
 * active member serves, `end` after a user-initiated close/destroy,
 * `terminated` when the client goes permanently unavailable. `error` reports
 * background failures and is optional — with no listener attached the error is
 * dropped, never thrown.
 * @experimental
 */
export interface MultiDbClientEvents {
  'connect': [];
  'ready': [];
  'end': [];
  'terminated': [TerminatedEvent];
  'error': [Error];
  'failover': [FailoverEvent];
  'fallback': [FallbackEvent];
  'database-unhealthy': [DatabaseUnhealthyEvent];
  'database-recovered': [DatabaseRecoveredEvent];
  'all-databases-down': [AllDatabasesDownEvent];
  'member-error': [MemberErrorEvent];
  'member-ready': [MemberReadyEvent];
  'member-end': [MemberEndEvent];
}

/**
 * The typed emitter half of the multi-db wrapper: the standard listener
 * management surface narrowed to {@link MultiDbClientEvents}. Registration and
 * removal work in every client state, including while every member is down.
 * @experimental
 */
export interface MultiDbEventEmitter {
  on<E extends keyof MultiDbClientEvents>(event: E, listener: (...args: MultiDbClientEvents[E]) => void): this;
  once<E extends keyof MultiDbClientEvents>(event: E, listener: (...args: MultiDbClientEvents[E]) => void): this;
  off<E extends keyof MultiDbClientEvents>(event: E, listener: (...args: MultiDbClientEvents[E]) => void): this;
  addListener<E extends keyof MultiDbClientEvents>(event: E, listener: (...args: MultiDbClientEvents[E]) => void): this;
  removeListener<E extends keyof MultiDbClientEvents>(event: E, listener: (...args: MultiDbClientEvents[E]) => void): this;
  prependListener<E extends keyof MultiDbClientEvents>(event: E, listener: (...args: MultiDbClientEvents[E]) => void): this;
  prependOnceListener<E extends keyof MultiDbClientEvents>(event: E, listener: (...args: MultiDbClientEvents[E]) => void): this;
  emit<E extends keyof MultiDbClientEvents>(event: E, ...args: MultiDbClientEvents[E]): boolean;
}

/**
 * A multi-db wrapper client: the member kind's full drop-in surface plus the
 * typed multi-db event emitter.
 * @experimental
 */
export type MultiDbClientType<C> = C & MultiDbEventEmitter;
