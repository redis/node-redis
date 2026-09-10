import { EventEmitter } from 'node:events';
import RedisClient, { RedisClientType, RedisClientOptions } from '../client';
import { RedisClientPool, RedisClientPoolType } from '../client/pool';
import RedisCluster, { RedisClusterType, RedisClusterOptions } from '../cluster';
import RedisSentinel from '../sentinel';
import { RedisSentinelType, RedisSentinelOptions } from '../sentinel/types';
import { RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping } from '../RESP/types';
import { PUBSUB_TYPE } from '../client/pub-sub';
import { MultiDbManager } from './manager';
import type { MemberAdapter, ResolvedMemberConfig } from './manager';
import { MultiDbController } from './controller';
import { resolveMultiDbConfig } from './config';
import type { DatabaseConfig, PoolDatabaseConfig, MultiDbConfig, ResolvedMultiDbConfig } from './config';
import type { MultiDbClientType } from './events';

/**
 * Multi-database client: N homogeneous member databases behind one drop-in
 * client. Each factory returns `{ client, controller }` — the contract lives
 * on {@link createMultiDbClient}; the multi-db-only surface is kept on
 * `controller` so `client` stays exactly the base client type.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Every client shape the multi-db layer can wrap.
 * @experimental
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- any parametrization of each client kind */
export type AnyRedisClientType =
  | RedisClientType<any, any, any, any, any>
  | RedisClientPoolType<any, any, any, any, any>
  | RedisClusterType<any, any, any, any, any>
  | RedisSentinelType<any, any, any, any, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Lifecycle members the multi-db layer intercepts (fan-out) rather than
 * forwarding to one DB. Must list every `MultiDbClientBase` method
 * (`constructor` aside) — forwarders are installed as own properties and
 * would silently shadow an unlisted one.
 */
const INTERCEPTED = new Set<PropertyKey>([
  'connect', 'close', 'destroy', 'quit',
  'withTypeMapping', 'withCommandOptions', 'withAbortSignal',
  'multi', 'MULTI', 'duplicate'
]);

/**
 * What every factory returns: the drop-in client plus the multi-db admin surface.
 * @experimental
 */
export interface MultiDbResult<
  C extends AnyRedisClientType,
  CONFIG extends DatabaseConfig<unknown> = PoolDatabaseConfig<unknown>
> {
  /** drop-in: the base client type plus the typed multi-db event surface */
  client: MultiDbClientType<C>;
  /** multi-db admin surface (no events — the client is the event surface) */
  controller: MultiDbController<C, CONFIG>;
}

/* -------------------------------------------------------------------------- */
/* client — the drop-in surface (typed exactly as C)                          */
/* -------------------------------------------------------------------------- */

/**
 * Lifecycle base: implements each `INTERCEPTED` member as a real fan-out
 * method. Everything else is patched on by `attachForwarders`. Extends
 * `EventEmitter` because the wrapper is the multi-db event surface — its
 * emitter methods are inherited (never forwarded to a member, never refused
 * while members are down).
 */
class MultiDbClientBase<C extends AnyRedisClientType> extends EventEmitter {
  /** @internal read by the forwarders patched below */
  readonly _mgr: MultiDbManager<C>;

  constructor(mgr: MultiDbManager<C>) {
    super();
    this._mgr = mgr;
  }

  connect() {
    return this._mgr.connect().then(() => this);
  }

  close() {
    return this._mgr.close();
  }

  destroy() {
    this._mgr.destroy();
  }

  quit() {
    return this._mgr.quit();
  }

  /**
   * Derived view with the given type mapping: commands issued through it apply
   * the mapping to whichever member is ACTIVE at each call — the view follows
   * failover, feeds the failure detector, and rejects while every member is
   * down, exactly like the wrapper itself.
   * @experimental
   */
  withTypeMapping(mapping: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- member kinds type withX themselves
    return makeDerived(this._mgr, client => (client as any).withTypeMapping(mapping));
  }

  /**
   * As {@link withTypeMapping}, over full command options.
   * @experimental
   */
  withCommandOptions(options: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- member kinds type withX themselves
    return makeDerived(this._mgr, client => (client as any).withCommandOptions(options));
  }

  /**
   * As {@link withTypeMapping}, over an abort signal.
   * @experimental
   */
  withAbortSignal(signal: AbortSignal) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- member kinds type withX themselves
    return makeDerived(this._mgr, client => (client as any).withAbortSignal(signal));
  }

  /**
   * Transaction builder PINNED to the member active at creation — a
   * transaction must execute wholly on one member, so it never follows a
   * failover. Its execution methods reject while every member is down and
   * report their outcome to the failure detector, attributed to the pinned
   * member. Create transactions per use, not at startup.
   * @experimental
   */
  multi() {
    return makePinnedMulti(this._mgr, client => client);
  }

  /** Raw-command spelling of {@link multi}. @experimental */
  MULTI() {
    return this.multi();
  }

  /**
   * A NEW, unconnected multi-db client over the CURRENT live member set
   * (runtime adds/removes and weight changes included) and the same
   * configuration — returned as the `{ client, controller }` pair the
   * factories produce, deliberately different from the base client's
   * `duplicate()` signature. `overrides` merge into every member's options
   * identically, so the clone stays homogeneous. Runtime state (circuit
   * states, active selection, a forced pin) is not copied.
   * @experimental
   */
  duplicate(overrides?: object): MultiDbResult<C> {
    const mgr = this._mgr.duplicate(overrides);
    return { client: makeClient(mgr), controller: new MultiDbController(mgr) };
  }
}

/**
 * Build a member's multi and patch its execution methods in place: the builder
 * methods chain on the same instance, so wrapping via a separate object would
 * be bypassed by the first chained call. `exec`/`execAsPipeline` gain the
 * fail-fast check and outcome reporting (the typed variants delegate to them).
 */
function makePinnedMulti<C extends AnyRedisClientType>(
  mgr: MultiDbManager<C>,
  resolve: ResolveClient<C>
): unknown {
  const member = mgr.activeDatabase;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic patching
  const inner = (resolve(member.client) as any).multi();

  for (const method of ['exec', 'execAsPipeline'] as const) {
    const original = inner[method].bind(inner);
    inner[method] = (...args: Array<unknown>) => {
      const unavailable = mgr.unavailableError;
      if (unavailable) return Promise.reject(unavailable);
      return original(...args).then(
        (reply: unknown) => {
          mgr.onCommandResult(true, undefined, member);
          return reply;
        },
        (err: unknown) => {
          mgr.onCommandResult(false, err as Error, member);
          throw err;
        }
      );
    };
  }
  return inner;
}

/**
 * Build a derived view: the wrapper's classified surface with `resolve`
 * applied to the active member at every command call. Views chain — a view of
 * a view composes both option sets in creation order.
 */
function makeDerived<C extends AnyRedisClientType>(
  mgr: MultiDbManager<C>,
  resolve: ResolveClient<C>
): C {
  const view = new MultiDbClientBase(mgr);
  attachForwarders(view, mgr, resolve);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic patching
  const dst = view as any;
  dst.withTypeMapping = (mapping: unknown) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- member kinds type withX themselves
    makeDerived(mgr, client => (resolve(client) as any).withTypeMapping(mapping));
  dst.withCommandOptions = (options: unknown) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- member kinds type withX themselves
    makeDerived(mgr, client => (resolve(client) as any).withCommandOptions(options));
  dst.withAbortSignal = (signal: AbortSignal) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- member kinds type withX themselves
    makeDerived(mgr, client => (resolve(client) as any).withAbortSignal(signal));
  dst.multi = () => makePinnedMulti(mgr, resolve);
  dst.MULTI = dst.multi;
  return view as unknown as C;
}

/**
 * Patch command methods + module/function namespaces onto `target`, forwarding
 * each to the ACTIVE DB. Same shape as `commander.ts:attachConfig` — real (own)
 * properties, no runtime trap — but discovered by walking a representative built
 * client's prototype chain instead of a command registry (kind-agnostic; avoids
 * importing each kind's registry + private executor). Runs ONCE at construction;
 * the closures read `mgr.active` at CALL time, so the method SET is fixed
 * (homogeneous DBs) while the TARGET tracks failover —
 * `manager.ts:MultiDbManager.switchTo`'s single-assignment repoint relies on
 * these reads staying uncached.
 */
// pinned, synchronously-returning surfaces (builders, derived handles,
// iterators) — while every member is down these throw at creation; a rejected
// promise would TypeError at the first chained call instead of failing
// meaningfully
const PINNED_SYNC = new Set<string>([
  'legacy',
  'scanIterator', 'hScanIterator', 'sScanIterator', 'zScanIterator'
]);

/**
 * A member-client transformation a derived view applies at every command call
 * — e.g. `client => client.withTypeMapping(mapping)`. Identity for the root
 * wrapper.
 */
type ResolveClient<C extends AnyRedisClientType> = (client: C) => C;

/**
 * Wrap one module/function/script namespace: same failover contract as a plain
 * command forwarder, per function. Each call rejects while every member is
 * down, reads the active member at CALL time, dispatches through the member's
 * own namespace (so `_self` binding and command options stay the member's),
 * and reports the settled outcome to `manager.ts:onCommandResult` attributed
 * to the member that served it.
 */
function wrapNamespace<C extends AnyRedisClientType>(
  name: string,
  sample: object,
  mgr: MultiDbManager<C>,
  resolve: ResolveClient<C>
): object {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic namespace shape
  const wrapped: any = {};
  // the function bag is the namespace object's prototype
  // (`commander.ts:attachNamespace` builds it as Object.create(fns))
  const fns = Object.getPrototypeOf(sample) as Record<string, unknown>;
  for (const fnName of Object.keys(fns)) {
    if (typeof fns[fnName] !== 'function') continue;
    wrapped[fnName] = (...args: Array<unknown>) => {
      const unavailable = mgr.unavailableError;
      if (unavailable) return Promise.reject(unavailable);
      const active = mgr.activeDatabase;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic dispatch
      const result = ((resolve(active.client) as any)[name])[fnName](...args) as Promise<unknown>;
      return result.then(
        (reply: unknown) => {
          mgr.onCommandResult(true, undefined, active);
          return reply;
        },
        (err: unknown) => {
          mgr.onCommandResult(false, err as Error, active);
          throw err;
        }
      );
    };
  }
  return wrapped;
}

function attachForwarders<C extends AnyRedisClientType>(
  target: MultiDbClientBase<C>,
  mgr: MultiDbManager<C>,
  resolve: ResolveClient<C> = client => client
): void {
  const skip = new Set<PropertyKey>([...INTERCEPTED, 'constructor']);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic patching
  const dst = target as any;

  // The walk covers exactly the client API — aliases, registry commands and
  // namespaces, then the hand-written kind API — and stops at the event
  // machinery: emitter methods belong to the wrapper's own EventEmitter (the
  // multi-db event surface), never to a member. The Object.prototype check is
  // a backstop for a member kind that does not extend EventEmitter.
  for (
    let proto = Object.getPrototypeOf(mgr.active);
    proto && proto !== EventEmitter.prototype && proto !== Object.prototype;
    proto = Object.getPrototypeOf(proto)
  ) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (skip.has(name)) continue;
      skip.add(name); // most-derived wins; don't reattach shadowed base members

      const desc = Object.getOwnPropertyDescriptor(proto, name)!;
      if (desc.get) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic probe
        const sample = (mgr.active as any)[name];
        if (sample !== null && typeof sample === 'object' && '_self' in sample) {
          // module/function/script namespace (`json`, `ft`, a library):
          // `commander.ts:attachNamespace` marks them with `_self`. Wrapped
          // once, cached — `client.json` stays reference-stable while every
          // call inside resolves the active member.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- lazy cache
          let cached: any;
          Object.defineProperty(dst, name, {
            get: () => (cached ??= wrapNamespace(name, sample, mgr, resolve)),
            enumerable: false
          });
        } else {
          // computed prop (`isOpen`, `options`) → live read from the active member
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic
          Object.defineProperty(dst, name, { get: () => (resolve(mgr.active) as any)[name], enumerable: false });
        }
      } else if (typeof desc.value === 'function') {
        // command / script method → call active's own method (this = active);
        // settled outcomes must reach `manager.ts:onCommandResult` — the detector feed
        dst[name] = (...args: Array<unknown>) => {
          // every member down: fail fast instead of queueing on a dead member.
          // Command methods reject (the base client's closed-client path also
          // rejects, so caller .catch chains keep working); pinned sync
          // surfaces have no promise to reject through and throw instead.
          const unavailable = mgr.unavailableError;
          if (unavailable) {
            if (PINNED_SYNC.has(name)) throw unavailable;
            return Promise.reject(unavailable);
          }
          // capture the serving member for outcome attribution: a settlement
          // arriving after a switch must not count against the new active
          const active = mgr.activeDatabase;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic
          const result = (resolve(active.client) as any)[name](...args);
          if (result instanceof Promise) {
            return result.then(
              (reply: unknown) => {
                mgr.onCommandResult(true, undefined, active);
                return reply;
              },
              (err: unknown) => {
                mgr.onCommandResult(false, err as Error, active);
                throw err;
              }
            );
          }
          return result;
        };
      }
    }
  }
}

function makeClient<C extends AnyRedisClientType>(mgr: MultiDbManager<C>): MultiDbClientType<C> {
  const client = new MultiDbClientBase(mgr);
  attachForwarders(client, mgr);
  // the wrapper is the single event surface: the manager emits through it
  mgr.bindEvents(client);
  return client as unknown as MultiDbClientType<C>;
}

/* -------------------------------------------------------------------------- */
/* Dedicated factories                                                        */
/* -------------------------------------------------------------------------- */

function assemble<
  C extends AnyRedisClientType,
  CONFIG extends DatabaseConfig<unknown> = PoolDatabaseConfig<unknown>
>(
  members: Array<ResolvedMemberConfig>,
  config: ResolvedMultiDbConfig,
  adapter: MemberAdapter<C>
): MultiDbResult<C, CONFIG> {
  const mgr = new MultiDbManager(members, config, adapter);
  return { client: makeClient(mgr), controller: new MultiDbController<C, CONFIG>(mgr) };
}

/**
 * Multi-database failover over standalone `RedisClient` members. Returns
 * `{ client, controller }`: `client` is a drop-in `RedisClientType` — command
 * methods forward to the active member, while `connect`/`close`/`destroy`/
 * `quit` fan out across all members; `controller` is the multi-db admin
 * surface (topology, weights, forced failover, events). Throws `TypeError`
 * synchronously on invalid config: no databases, duplicate ids, weight
 * outside [0, 1], or health-check timeout >= interval.
 * @experimental
 */
export function createMultiDbClient<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  T extends TypeMapping = {}
>(options: {
  databases: Array<DatabaseConfig<RedisClientOptions<M, F, S, RESP, T>>>;
} & MultiDbConfig): MultiDbResult<RedisClientType<M, F, S, RESP, T>, DatabaseConfig<RedisClientOptions<M, F, S, RESP, T>>> {
  const { databases, config } = resolveMultiDbConfig(options.databases, options);
  const adapter: MemberAdapter<RedisClientType<M, F, S, RESP, T>> = {
    create: db => RedisClient.create(db.options as RedisClientOptions<M, F, S, RESP, T>),
    sendCommand: (client, args) => client.sendCommand(args),
    movePubSub: async (from, to) => {
      // removal (not a copy) keeps a recovering old member from re-subscribing
      // server-side and double-delivering to the same listener functions
      const listeners = from._getQueue().removeAllPubSubListeners();
      await Promise.all([
        to.extendPubSubListeners(PUBSUB_TYPE.CHANNELS, listeners[PUBSUB_TYPE.CHANNELS]),
        to.extendPubSubListeners(PUBSUB_TYPE.PATTERNS, listeners[PUBSUB_TYPE.PATTERNS]),
        to.extendPubSubListeners(PUBSUB_TYPE.SHARDED, listeners[PUBSUB_TYPE.SHARDED])
      ]);
      // subscriber state survives server-side on the old member's live main
      // connection; left in place, a RESP2 member rejects every regular command
      // when traffic later returns to it. Best-effort: a member that is down
      // reconnects with a fresh connection and empty maps, so there is nothing
      // to clean.
      if (from.isReady) {
        await Promise.allSettled([
          listeners[PUBSUB_TYPE.CHANNELS].size ? from.unsubscribe() : undefined,
          listeners[PUBSUB_TYPE.PATTERNS].size ? from.pUnsubscribe() : undefined,
          listeners[PUBSUB_TYPE.SHARDED].size ? from.sUnsubscribe() : undefined
        ]);
      }
    }
  };
  return assemble(databases, config, adapter);
}

/** As {@link createMultiDbClient}, over pooled (`RedisClientPool`) members. @experimental */
export function createMultiDbClientPool<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  T extends TypeMapping = {}
>(options: {
  databases: Array<PoolDatabaseConfig<RedisClientOptions<M, F, S, RESP, T>>>;
} & MultiDbConfig): MultiDbResult<RedisClientPoolType<M, F, S, RESP, T>, PoolDatabaseConfig<RedisClientOptions<M, F, S, RESP, T>>> {
  const { databases, config } = resolveMultiDbConfig(options.databases, options);
  const adapter: MemberAdapter<RedisClientPoolType<M, F, S, RESP, T>> = {
    create: db => RedisClientPool.create(db.options as RedisClientOptions<M, F, S, RESP, T>, db.poolOptions),
    sendCommand: (client, args) => client.sendCommand(args)
    // no movePubSub: a pool has no pub/sub surface (subscriptions need a
    // dedicated connection, which the pool does not expose), so there is
    // nothing to transfer on failover
  };
  return assemble(databases, config, adapter);
}

/** As {@link createMultiDbClient}, over `RedisCluster` members. @experimental */
export function createMultiDbCluster<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  T extends TypeMapping = {}
>(options: {
  databases: Array<DatabaseConfig<RedisClusterOptions<M, F, S, RESP, T>>>;
} & MultiDbConfig): MultiDbResult<RedisClusterType<M, F, S, RESP, T>, DatabaseConfig<RedisClusterOptions<M, F, S, RESP, T>>> {
  const { databases, config } = resolveMultiDbConfig(options.databases, options);
  const adapter: MemberAdapter<RedisClusterType<M, F, S, RESP, T>> = {
    create: db => RedisCluster.create(db.options as RedisClusterOptions<M, F, S, RESP, T>),
    // keyless dispatch — the cluster routes it to an arbitrary node
    sendCommand: (client, args) => client.sendCommand(undefined, undefined, args),
    movePubSub: async (from, to) => {
      // detach on the old cluster (channels/patterns on its pub/sub node,
      // sharded per shard) so a recovering member can't double-deliver, then
      // re-subscribe across the new cluster's nodes
      await to.resubscribeAllPubSubListeners(from._removeAllPubSubListeners());
    }
  };
  return assemble(databases, config, adapter);
}

/** As {@link createMultiDbClient}, over `RedisSentinel` members. @experimental */
export function createMultiDbSentinel<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  T extends TypeMapping = {}
>(options: {
  databases: Array<DatabaseConfig<RedisSentinelOptions<M, F, S, RESP, T>>>;
} & MultiDbConfig): MultiDbResult<RedisSentinelType<M, F, S, RESP, T>, DatabaseConfig<RedisSentinelOptions<M, F, S, RESP, T>>> {
  const { databases, config } = resolveMultiDbConfig(options.databases, options);
  const adapter: MemberAdapter<RedisSentinelType<M, F, S, RESP, T>> = {
    create: db => RedisSentinel.create(db.options as RedisSentinelOptions<M, F, S, RESP, T>),
    sendCommand: (client, args) => client.sendCommand(undefined, args),
    movePubSub: async (from, to) => {
      // detach from the old member's pub/sub proxy (so a recovering member
      // can't double-deliver) and re-establish against the new member's master
      await to._adoptPubSubListeners(from._extractPubSubListeners());
    }
  };
  return assemble(databases, config, adapter);
}

/* -------------------------------------------------------------------------- */
/* Public surface re-exports                                                  */
/* -------------------------------------------------------------------------- */

export {
  MultiDbController,
  type DatabaseDescriptor
} from './controller';
export type {
  FailoverReason,
  FailoverEvent,
  FallbackEvent,
  DatabaseUnhealthyEvent,
  DatabaseRecoveredEvent,
  AllDatabasesDownEvent,
  TerminatedEvent,
  MemberErrorEvent,
  MemberReadyEvent,
  MemberEndEvent,
  MultiDbClientEvents,
  MultiDbEventEmitter,
  MultiDbClientType
} from './events';
export { TemporarilyUnavailableError, PermanentlyUnavailableError } from './errors';
export type { DatabaseRole } from './database';
export type {
  MultiDbConfig,
  DatabaseConfig,
  PoolDatabaseConfig,
  HealthCheckConfig,
  FailureDetectorConfig,
  ProbePolicy,
  InitialAvailability
} from './config';
export {
  DefaultFailureDetector,
  type FailureDetector,
  type DefaultFailureDetectorOptions
} from './failure-detector';
export { DefaultHealthCheck, type HealthCheck, type HealthCheckTarget } from './health-check';
export { LagAwareHealthCheck, type LagAwareHealthCheckOptions } from './lag-aware-health-check';
export { WeightBasedStrategy, type FailoverStrategy } from './failover-strategy';
export type { CircuitState } from './circuit';
