/**
 * The multi-db wrapper's event surface. The wrapper (the drop-in client) is
 * the single event emitter of the feature: logical lifecycle about the client
 * as a whole, an optional aggregated `error`, the multi-db decision events,
 * and per-member `member-*` pass-throughs. The controller emits nothing.
 */

import type { MultiDbResult } from './index';
import type { RedisClientType } from '../client';
import type { RedisClientPoolType } from '../client/pool';
import type { RedisClusterType } from '../cluster';
import type { RedisSentinelType } from '../sentinel/types';
import type { CommandOptions } from '../client/commands-queue';
import type { RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping } from '../RESP/types';

/** @experimental why an automatic switch happened */
export type FailoverReason = 'failure-detector' | 'health-check' | 'connection-ended' | 'forced' | 'active-removed';

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
 * The member kinds the multi-db layer wraps, keyed by name. The key travels
 * through {@link MultiDbClientType} instead of the client type itself: the
 * factory always knows its kind statically, so the compiler never has to
 * infer it by relating a concrete client type against the giant kind shapes —
 * the exact operation that made the earlier conditional-type design cost
 * millions of instantiations and collapse cluster views to `never`.
 * @experimental
 */
export interface RedisClientKinds<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TM extends TypeMapping
> {
  client: RedisClientType<M, F, S, RESP, TM>;
  pool: RedisClientPoolType<M, F, S, RESP, TM>;
  cluster: RedisClusterType<M, F, S, RESP, TM>;
  sentinel: RedisSentinelType<M, F, S, RESP, TM>;
}

/** @experimental */
export type RedisClientKind = keyof RedisClientKinds<
  RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping
>;

/**
 * A multi-db wrapper client: the member kind's full drop-in surface plus the
 * typed multi-db event emitter. Deliberate signature differences from the
 * bare member type:
 * - `duplicate()` returns the factory-shaped `{ client, controller }` pair,
 *   not a bare client — the type must say so, or `duplicate().connect()`
 *   compiles and crashes;
 * - the derived-view members return this same multi-db type, so a view keeps
 *   the typed event surface and the pair-shaped `duplicate()`, and a mapping
 *   view keeps reply-type fidelity by pure index substitution (`TM := M2`).
 * @experimental
 */
export type MultiDbClientType<
  K extends RedisClientKind,
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TM extends TypeMapping = {}
> =
  Omit<
    RedisClientKinds<M, F, S, RESP, TM>[K],
    // the emitter methods are omitted too: the wrapper's documented event
    // surface is exactly MultiDbClientEvents, and the kind's untyped
    // `on(string, ...)` overload would otherwise swallow event-name typos
    | 'duplicate' | 'withTypeMapping' | 'withCommandOptions' | 'withAbortSignal' | 'asap'
    | keyof MultiDbEventEmitter
  > &
  MultiDbEventEmitter &
  {
    /**
     * A NEW, unconnected multi-db pair over the current live member set —
     * see the runtime contract on the wrapper's `duplicate()`.
     * @experimental
     */
    duplicate(overrides?: object): MultiDbResult<K, M, F, S, RESP, TM>;
    /** Derived view with the given type mapping — see the wrapper's `withTypeMapping()`. @experimental */
    withTypeMapping<M2 extends TypeMapping>(typeMapping: M2): MultiDbClientType<K, M, F, S, RESP, M2>;
    /** Derived view over full command options — see the wrapper's `withCommandOptions()`. @experimental */
    withCommandOptions<
      OPTIONS extends CommandOptions<M2>,
      M2 extends TypeMapping
    >(options: OPTIONS): MultiDbClientType<K, M, F, S, RESP, M2>;
  } &
  // string-literal conditional (free): only the kinds that expose these get them
  (K extends 'client' | 'pool'
    ? {
        /** Derived view over an abort signal. @experimental */
        withAbortSignal(abortSignal: AbortSignal): MultiDbClientType<K, M, F, S, RESP, TM>;
        /** Derived view with the asap flag. @experimental */
        asap(): MultiDbClientType<K, M, F, S, RESP, TM>;
      }
    : unknown);
