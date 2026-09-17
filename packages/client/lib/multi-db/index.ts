import { EventEmitter } from 'node:events';
import RedisClient, { RedisClientType, RedisClientOptions } from '../client';
import { RedisClientPool, RedisClientPoolType } from '../client/pool';
import RedisCluster, { RedisClusterType, RedisClusterOptions } from '../cluster';
import RedisSentinel from '../sentinel';
import { RedisSentinelType, RedisSentinelOptions } from '../sentinel/types';
import { RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping } from '../RESP/types';
import { PUBSUB_TYPE } from '../client/pub-sub';
import { WatchError } from '../errors';
import { MultiDbManager } from './manager';
import type { MemberAdapter, ResolvedMemberConfig } from './manager';
import { MultiDbController } from './controller';
import { resolveMultiDbConfig } from './config';
import type { DatabaseConfig, PoolDatabaseConfig, MultiDbConfig, ResolvedMultiDbConfig } from './config';
import type { MultiDbClientType, RedisClientKind, RedisClientKinds } from './events';

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
 * Structural stand-in for "some Redis client kind" — the constraint the
 * multi-db machinery uses. Deliberately minimal: constraining on the full
 * union of client types forces the compiler to compute variance over the four
 * complete client surfaces during library check (measured: +1.8M type
 * instantiations and ~4x check time for a bare `import 'redis'` with
 * skipLibCheck off), and those relations are unreliable at that type size.
 * The machinery only ever needs this lifecycle shape; each factory binds the
 * concrete kind.
 * @experimental
 */
export interface RedisClientLike {
  connect(): Promise<unknown>;
  close(): Promise<void>;
  destroy(): void | Promise<void>;
  isOpen: boolean;
}

/**
 * Lifecycle members the multi-db layer intercepts (fan-out) rather than
 * forwarding to one DB. Must list every `MultiDbClientBase` method
 * (`constructor` aside) — forwarders are installed as own properties and
 * would silently shadow an unlisted one.
 */
const INTERCEPTED = new Set<PropertyKey>([
  'connect', 'close', 'destroy', 'quit', 'QUIT', 'disconnect',
  'withTypeMapping', 'withCommandOptions', 'withAbortSignal', 'asap',
  'multi', 'MULTI', 'duplicate'
]);

/**
 * What every factory returns: the drop-in client plus the multi-db admin surface.
 * @experimental
 */
export interface MultiDbResult<
  K extends RedisClientKind,
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TM extends TypeMapping = {},
  CONFIG extends DatabaseConfig<unknown> = PoolDatabaseConfig<unknown>
> {
  /** drop-in: the member kind's type plus the typed multi-db event surface */
  client: MultiDbClientType<K, M, F, S, RESP, TM>;
  /** multi-db admin surface (no events — the client is the event surface) */
  controller: MultiDbController<RedisClientKinds<M, F, S, RESP, TM>[K], CONFIG>;
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
class MultiDbClientBase<C extends RedisClientLike> extends EventEmitter {
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

  /**
   * Fan-out teardown; resolves once every member finished. Standalone members
   * destroy synchronously — awaiting matters for kinds with asynchronous
   * teardown (sentinel).
   */
  destroy() {
    return this._mgr.destroy();
  }

  /**
   * Graceful fan-out close across all members. Resolves the aggregate ack
   * `'OK'` — the logical client's own acknowledgement, matching the base
   * client's `quit()` return type (there is no single member reply to
   * surface, and QUIT itself is server-deprecated with no response policy).
   * Best-effort per member, like {@link close}.
   */
  quit() {
    return this._mgr.quit().then(() => 'OK' as const);
  }

  /** Deprecated base-client alias of {@link quit} — same graceful fan-out. @experimental */
  QUIT() {
    return this.quit();
  }

  /**
   * Deprecated base-client alias of {@link destroy} — fans out the forceful
   * teardown across all members. Forwarded to only the active member it would
   * read as a member failure and turn shutdown into a failover.
   * @experimental
   */
  disconnect() {
    return this._mgr.destroy();
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
    return makeDerived(this._mgr, client => (client as any).withTypeMapping(mapping), this);
  }

  /**
   * As {@link withTypeMapping}, over full command options.
   * @experimental
   */
  withCommandOptions(options: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- member kinds type withX themselves
    return makeDerived(this._mgr, client => (client as any).withCommandOptions(options), this);
  }

  /**
   * As {@link withTypeMapping}, over an abort signal.
   * @experimental
   */
  withAbortSignal(signal: AbortSignal) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- member kinds type withX themselves
    return makeDerived(this._mgr, client => (client as any).withAbortSignal(signal), this);
  }

  /**
   * As {@link withTypeMapping}, over the asap flag — commands issued through
   * the view jump the ACTIVE member's queue at each call. Only member kinds
   * that expose `asap()` support it.
   * @experimental
   */
  asap() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- member kinds type asap themselves
    return makeDerived(this._mgr, client => (client as any).asap(), this);
  }

  /**
   * Transaction builder PINNED to the member active at creation — a
   * transaction must execute wholly on one member, so it never follows a
   * failover. Its execution methods reject while every member is down and
   * report their outcome to the failure detector, attributed to the pinned
   * member; an EXEC whose watch session was invalidated by a switch rejects
   * with WatchError. Create transactions per use, not at startup.
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
   * states, active selection, a forced pin) is not copied. Throws TypeError
   * when the config holds a custom failure-detector INSTANCE — its state
   * cannot be shared across clients; pass a factory instead.
   * @experimental
   */
  duplicate(overrides?: object) {
    const mgr = this._mgr.duplicate(overrides);
    // internal pair shape; the public signature lives on MultiDbClientType
    return { client: makeClient(mgr), controller: new MultiDbController(mgr) };
  }
}

/**
 * Build a member's multi and patch its execution methods in place: the builder
 * methods chain on the same instance, so wrapping via a separate object would
 * be bypassed by the first chained call. `exec`/`execAsPipeline` gain the
 * fail-fast check and outcome reporting (the typed variants delegate to them).
 */
function makePinnedMulti<C extends RedisClientLike>(
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
      // exec(true) runs as a pipeline: delegate to the wrapped execAsPipeline —
      // through the original it re-enters via `this` and BOTH wrappers would
      // report the one call to the detector
      if (method === 'exec' && args[0]) return inner.execAsPipeline();
      // a switch invalidated the watch session: commit nothing — the app's
      // standard WatchError retry loop re-runs on the new active member
      if (method === 'exec' && mgr.watchDirty) {
        mgr.clearWatchSession();
        return Promise.reject(new WatchError('MultiDb: the active database changed after WATCH'));
      }
      // a real EXEC settles a session held by this member: the server consumes
      // its watches on delivery, and a failed EXEC means the watching
      // connection is gone anyway
      const settlesWatch = method === 'exec' && mgr.watchedMember === member;
      return original(...args).then(
        (reply: unknown) => {
          if (settlesWatch) mgr.clearWatchSession();
          mgr.onCommandResult(true, undefined, member);
          return reply;
        },
        (err: unknown) => {
          if (settlesWatch) mgr.clearWatchSession();
          mgr.onCommandResult(false, err as Error, member);
          throw err;
        }
      );
    };
  }
  // the EXEC class-field alias captured the prototype exec at construction —
  // repoint it or it bypasses the gate, the detector feed and the watch release
  if (typeof inner.EXEC === 'function') inner.EXEC = inner.exec;
  // same policy as the top-level SELECT forwarder: a transaction-scoped SELECT
  // still changes one member's connection db, which cannot follow a failover
  for (const method of ['select', 'SELECT'] as const) {
    if (typeof inner[method] === 'function') {
      inner[method] = () => {
        throw new Error(
          "MultiDb: SELECT is not supported through the multi-db client — set 'database' per member in its options"
        );
      };
    }
  }
  return inner;
}

/**
 * WATCH is connection-scoped server state that cannot follow a failover. The
 * first WATCH anchors the session to the member that served it; a switch
 * invalidates the session (`manager.ts:switchTo` sets `watchDirty`) and the
 * next EXEC rejects with WatchError (`makePinnedMulti`) — the same retryable
 * error a conflict or a base-client reconnect produces — so the app's
 * standard retry loop re-runs the whole cycle on the new active member. A
 * later WATCH never re-anchors an existing session (mirroring the base
 * client, where a post-reconnect WATCH does not heal the stale epoch); EXEC
 * and UNWATCH clear it.
 */
function makeWatchForwarder<C extends RedisClientLike>(
  mgr: MultiDbManager<C>,
  resolve: ResolveClient<C>,
  name: string
): (...args: Array<unknown>) => Promise<unknown> {
  return (...args) => {
    const unavailable = mgr.unavailableError;
    if (unavailable) return Promise.reject(unavailable);
    const active = mgr.activeDatabase;
    const firstWatch = mgr.watchedMember === null;
    if (firstWatch) mgr.watchedMember = active;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic dispatch
    return ((resolve(active.client) as any)[name](...args) as Promise<unknown>).then(
      (reply: unknown) => {
        mgr.onCommandResult(true, undefined, active);
        return reply;
      },
      (err: unknown) => {
        // a rejected FIRST watch never started a session
        if (firstWatch) mgr.clearWatchSession();
        mgr.onCommandResult(false, err as Error, active);
        throw err;
      }
    );
  };
}

/** See {@link makeWatchForwarder}: UNWATCH settles the session on the active
 * member, dirty or not — a fresh session must start clean. */
function makeUnwatchForwarder<C extends RedisClientLike>(
  mgr: MultiDbManager<C>,
  resolve: ResolveClient<C>,
  name: string
): (...args: Array<unknown>) => Promise<unknown> {
  return (...args) => {
    const unavailable = mgr.unavailableError;
    if (unavailable) return Promise.reject(unavailable);
    const active = mgr.activeDatabase;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic dispatch
    return ((resolve(active.client) as any)[name](...args) as Promise<unknown>).then(
      (reply: unknown) => {
        mgr.clearWatchSession();
        mgr.onCommandResult(true, undefined, active);
        return reply;
      },
      (err: unknown) => {
        mgr.clearWatchSession();
        mgr.onCommandResult(false, err as Error, active);
        throw err;
      }
    );
  };
}

// EventEmitter registration methods a derived view forwards to the root
// wrapper: they attach to the root (where the manager emits) but return the
// view for chaining.
const DELEGATED_EMITTER_METHODS = [
  'on', 'once', 'off', 'addListener', 'removeListener',
  'prependListener', 'prependOnceListener'
] as const;

/**
 * Build a derived view: the wrapper's classified surface with `resolve`
 * applied to the active member at every command call. Views chain — a view of
 * a view composes both option sets in creation order. `eventRoot` is the root
 * wrapper the manager emits through; the view delegates its event surface to
 * it so listeners registered on a view actually fire.
 */
function makeDerived<C extends RedisClientLike>(
  mgr: MultiDbManager<C>,
  resolve: ResolveClient<C>,
  eventRoot: EventEmitter
): C {
  const view = new MultiDbClientBase(mgr);
  attachForwarders(view, mgr, resolve);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic patching
  const dst = view as any;
  // the manager emits through the root wrapper only (makeClient binds it), so
  // a view's own inherited EventEmitter would never fire — delegate the event
  // surface to the root, keeping the single documented event surface honest
  for (const method of DELEGATED_EMITTER_METHODS) {
    dst[method] = (event: string, listener: (...args: Array<unknown>) => void) => {
      (eventRoot as unknown as Record<string, (...a: Array<unknown>) => unknown>)[method](event, listener);
      return dst;
    };
  }
  dst.emit = (event: string, ...args: Array<unknown>) => eventRoot.emit(event, ...args);
  dst.listenerCount = (event: string) => eventRoot.listenerCount(event);
  dst.listeners = (event: string) => eventRoot.listeners(event);
  dst.eventNames = () => eventRoot.eventNames();
  dst.withTypeMapping = (mapping: unknown) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- member kinds type withX themselves
    makeDerived(mgr, client => (resolve(client) as any).withTypeMapping(mapping), eventRoot);
  dst.withCommandOptions = (options: unknown) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- member kinds type withX themselves
    makeDerived(mgr, client => (resolve(client) as any).withCommandOptions(options), eventRoot);
  dst.withAbortSignal = (signal: AbortSignal) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- member kinds type withX themselves
    makeDerived(mgr, client => (resolve(client) as any).withAbortSignal(signal), eventRoot);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- member kinds type asap themselves
  dst.asap = () => makeDerived(mgr, client => (resolve(client) as any).asap(), eventRoot);
  dst.multi = () => makePinnedMulti(mgr, resolve);
  dst.MULTI = dst.multi;
  // duplicate() on a view must carry the view's options: the inherited base
  // duplicate rebuilds through the identity resolve, silently dropping the
  // mapping the type promises. Re-derive through this view's `resolve`, over a
  // FRESH event root bound to the duplicated manager — the clone must not
  // share the original's event surface.
  dst.duplicate = (overrides?: object) => {
    const dupMgr = mgr.duplicate(overrides);
    const root = makeClient(dupMgr);
    return {
      client: makeDerived(dupMgr, resolve, root),
      controller: new MultiDbController(dupMgr)
    };
  };
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
// the gate also treats any '*Iterator' name as pinned-sync structurally —
// this set once missed two of the six scan iterators, and a new one added to
// a member kind must not reopen that hole
const PINNED_SYNC = new Set<string>([
  'legacy',
  'scanIterator', 'hScanIterator', 'hScanValuesIterator', 'hScanNoValuesIterator',
  'sScanIterator', 'zScanIterator'
]);

/**
 * A member-client transformation a derived view applies at every command call
 * — e.g. `client => client.withTypeMapping(mapping)`. Identity for the root
 * wrapper.
 */
type ResolveClient<C extends RedisClientLike> = (client: C) => C;

/**
 * Wrap one module/function/script namespace: same failover contract as a plain
 * command forwarder, per function. Each call rejects while every member is
 * down, reads the active member at CALL time, dispatches through the member's
 * own namespace (so `_self` binding and command options stay the member's),
 * and reports the settled outcome to `manager.ts:onCommandResult` attributed
 * to the member that served it.
 */
function wrapNamespace<C extends RedisClientLike>(
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

function attachForwarders<C extends RedisClientLike>(
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
        } else if (name === 'isReady') {
          // isReady is the "can the logical client serve now?" signal, so it
          // must agree with dispatch: the active member's socket can be up
          // while the manager gates every command behind unavailableError
          // (searching, or permanently failed). An app that checks isReady
          // before sending would otherwise send into a wall.
          Object.defineProperty(dst, name, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic
            get: () => mgr.unavailableError ? false : (resolve(mgr.active) as any).isReady,
            enumerable: false
          });
        } else {
          // computed prop (`isOpen`, `options`) → live read from the active member
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic
          Object.defineProperty(dst, name, { get: () => (resolve(mgr.active) as any)[name], enumerable: false });
        }
      } else if (typeof desc.value === 'function') {
        // watch sessions are member-bound — see makeWatchForwarder
        if (name === 'WATCH' || name === 'watch') {
          dst[name] = makeWatchForwarder(mgr, resolve, name);
          continue;
        }
        if (name === 'UNWATCH' || name === 'unwatch') {
          dst[name] = makeUnwatchForwarder(mgr, resolve, name);
          continue;
        }
        // lifecycle, not a command: fan out over every member — unref'ing only
        // the active one leaves N-1 passive sockets holding the event loop
        // open. No availability gate (a down member must not fail it), no
        // detector feed, void return like the base client's.
        if (name === 'ref' || name === 'unref') {
          dst[name] = () => {
            mgr.refState = name as 'ref' | 'unref';
            for (const db of mgr.databases) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic dispatch
              (db.client as any)[name]();
            }
          };
          continue;
        }
        // SELECT mutates connection-scoped session state that cannot follow a
        // failover — the new member would silently serve a different keyspace.
        // Per-member 'database' options are the supported way.
        if (name === 'SELECT' || name === 'select') {
          dst[name] = () => Promise.reject(new Error(
            "MultiDb: SELECT is not supported through the multi-db client — set 'database' per member in its options"
          ));
          continue;
        }
        // MONITOR puts a connection into a permanent monitoring mode (re-applied
        // on every reconnect) — connection-scoped state like SELECT that cannot
        // follow a failover. Attach it to an individual member instead.
        if (name === 'MONITOR' || name === 'monitor') {
          dst[name] = () => Promise.reject(new Error(
            'MultiDb: MONITOR is not supported through the multi-db client — attach it to an individual member'
          ));
          continue;
        }
        // command / script method → call active's own method (this = active);
        // settled outcomes must reach `manager.ts:onCommandResult` — the detector feed
        dst[name] = (...args: Array<unknown>) => {
          // every member down: fail fast instead of queueing on a dead member.
          // Command methods reject (the base client's closed-client path also
          // rejects, so caller .catch chains keep working); pinned sync
          // surfaces have no promise to reject through and throw instead.
          const unavailable = mgr.unavailableError;
          if (unavailable) {
            if (PINNED_SYNC.has(name) || name.endsWith('Iterator')) throw unavailable;
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

function makeClient<C extends RedisClientLike>(mgr: MultiDbManager<C>): MultiDbClientBase<C> {
  const client = new MultiDbClientBase(mgr);
  attachForwarders(client, mgr);
  // the wrapper is the single event surface: the manager emits through it
  mgr.bindEvents(client);
  return client;
}

/* -------------------------------------------------------------------------- */
/* Dedicated factories                                                        */
/* -------------------------------------------------------------------------- */

function assemble<C extends RedisClientLike>(
  members: Array<ResolvedMemberConfig>,
  config: ResolvedMultiDbConfig,
  adapter: MemberAdapter<C>
) {
  const mgr = new MultiDbManager(members, config, adapter);
  return { client: makeClient(mgr), controller: new MultiDbController(mgr) };
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
} & MultiDbConfig): MultiDbResult<'client', M, F, S, RESP, T, DatabaseConfig<RedisClientOptions<M, F, S, RESP, T>>> {
  const { databases, config } = resolveMultiDbConfig(options.databases, options);
  const adapter: MemberAdapter<RedisClientType<M, F, S, RESP, T>> = {
    create: db => RedisClient.create(db.options as RedisClientOptions<M, F, S, RESP, T>),
    sendCommand: (client, args) => client.sendCommand(args),
    movePubSub: async (from, to, isCurrent) => {
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
      // to clean. Skip if superseded: a switch-back (A→B→A) may have
      // re-subscribed `from` while this await was parked — unsubscribing it
      // now would tear down the subscriptions the newer switch just restored.
      if (from.isReady && isCurrent()) {
        await Promise.allSettled([
          listeners[PUBSUB_TYPE.CHANNELS].size ? from.unsubscribe() : undefined,
          listeners[PUBSUB_TYPE.PATTERNS].size ? from.pUnsubscribe() : undefined,
          listeners[PUBSUB_TYPE.SHARDED].size ? from.sUnsubscribe() : undefined
        ]);
      }
    },
    rejectQueued: (from, error) => {
      // ready members drain their queue immediately — only a down member's
      // unsent commands would otherwise survive to replay on reconnect. Its
      // in-flight commands were already rejected by the socket-error path, so
      // this clears exactly the unsent backlog.
      if (from.isReady) return;
      from._getQueue().flushAll(error);
    }
  };
  return assemble(databases, config, adapter) as unknown as
    MultiDbResult<'client', M, F, S, RESP, T, DatabaseConfig<RedisClientOptions<M, F, S, RESP, T>>>;
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
} & MultiDbConfig): MultiDbResult<'pool', M, F, S, RESP, T, PoolDatabaseConfig<RedisClientOptions<M, F, S, RESP, T>>> {
  const { databases, config } = resolveMultiDbConfig(options.databases, options);
  const adapter: MemberAdapter<RedisClientPoolType<M, F, S, RESP, T>> = {
    create: db => RedisClientPool.create(db.options as RedisClientOptions<M, F, S, RESP, T>, db.poolOptions),
    sendCommand: (client, args) => client.sendCommand(args)
    // no movePubSub: a pool has no pub/sub surface (subscriptions need a
    // dedicated connection, which the pool does not expose), so there is
    // nothing to transfer on failover
  };
  return assemble(databases, config, adapter) as unknown as
    MultiDbResult<'pool', M, F, S, RESP, T, PoolDatabaseConfig<RedisClientOptions<M, F, S, RESP, T>>>;
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
} & MultiDbConfig): MultiDbResult<'cluster', M, F, S, RESP, T, DatabaseConfig<RedisClusterOptions<M, F, S, RESP, T>>> {
  const { databases, config } = resolveMultiDbConfig(options.databases, options);
  const adapter: MemberAdapter<RedisClusterType<M, F, S, RESP, T>> = {
    create: db => RedisCluster.create(db.options as RedisClusterOptions<M, F, S, RESP, T>),
    // keyless dispatch — the cluster routes it to an arbitrary node
    sendCommand: (client, args) => client.sendCommand(undefined, undefined, args),
    movePubSub: async (from, to) => {
      // detach on the old cluster (channels/patterns on its pub/sub node,
      // sharded per shard) so a recovering member can't double-deliver, and
      // seed the new cluster's own pub/sub state in the same tick — a second
      // switch extracting mid-adoption must still find every listener
      await to._extendAllPubSubListeners(from._removeAllPubSubListeners());
    }
  };
  return assemble(databases, config, adapter) as unknown as
    MultiDbResult<'cluster', M, F, S, RESP, T, DatabaseConfig<RedisClusterOptions<M, F, S, RESP, T>>>;
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
} & MultiDbConfig): MultiDbResult<'sentinel', M, F, S, RESP, T, DatabaseConfig<RedisSentinelOptions<M, F, S, RESP, T>>> {
  const { databases, config } = resolveMultiDbConfig(options.databases, options);
  const adapter: MemberAdapter<RedisSentinelType<M, F, S, RESP, T>> = {
    create: db => RedisSentinel.create(db.options as RedisSentinelOptions<M, F, S, RESP, T>),
    sendCommand: (client, args) => client.sendCommand(undefined, args),
    // the sentinel 'error' channel mixes node passthrough, observe-loop and
    // pub/sub-proxy noise - fault evidence comes from the MASTER-typed
    // client-error channel instead (see MemberAdapter.untypedErrorIsFault)
    untypedErrorIsFault: false,
    movePubSub: async (from, to) => {
      // detach from the old member's pub/sub proxy (so a recovering member
      // can't double-deliver) and re-establish against the new member's master
      await to._adoptPubSubListeners(from._extractPubSubListeners());
    }
  };
  return assemble(databases, config, adapter) as unknown as
    MultiDbResult<'sentinel', M, F, S, RESP, T, DatabaseConfig<RedisSentinelOptions<M, F, S, RESP, T>>>;
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
export { TemporarilyUnavailableError, PermanentlyUnavailableError, CommandAbandonedError } from './errors';
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
export { WeightBasedStrategy, type FailoverStrategy, type FailoverCandidate } from './failover-strategy';
export type { CircuitState } from './circuit';
