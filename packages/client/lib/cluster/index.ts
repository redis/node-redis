import { RedisClientOptions, RedisClientType, WithFunctions, WithModules, WithScripts } from '../client';
import { CommandOptions } from '../client/commands-queue';
import { Command, CommandArguments, CommanderConfig, CommandSignature, TypeMapping, RedisArgument, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts, ReplyUnion, RespVersions } from '../RESP/types';
import { NON_STICKY_COMMANDS } from '../commands';
import { EventEmitter } from 'node:events';
import { attachConfig, functionArgumentsPrefix, getTransformReply, scriptArgumentsPrefix } from '../commander';
import RedisClusterSlots, { NodeAddressMap, RESUBSCRIBE_LISTENERS_EVENT, ShardNode } from './cluster-slots';
import RedisClusterMultiCommand, { RedisClusterMultiCommandType } from './multi-command';
import { PubSubListener, PubSubListeners } from '../client/pub-sub';
import { ErrorReply } from '../errors';
import { RedisTcpSocketOptions } from '../client/socket';
import { ClientSideCacheConfig, PooledClientSideCacheProvider } from '../client/cache';
import { BasicCommandParser, CommandParser } from '../client/parser';
import { ASKING_CMD } from '../commands/ASKING';
import SingleEntryCache from '../single-entry-cache'
import { publish, CHANNELS } from '../client/tracing';
import { ClientIdentity, ClientRole, generateClusterClientId } from '../client/identity';
import { DEFAULT_COMMAND_TIMEOUT } from '../defaults';
import { defaultCommandMetadata, defaultCommandPolicies, isReplicaSafe, PolicyResolver, REQUEST_POLICIES_WITH_DEFAULTS, RESPONSE_POLICIES_WITH_DEFAULTS, type CommandMetadata } from '../command-metadata';
import { REQUEST_ROUTERS, RESPONSE_REDUCERS, NUMERIC_AGG_POLICIES, remapAggregateReply } from './request-response-policies/dispatch';
import calculateSlot from 'cluster-key-slot';
import { finalizeFtCursor } from './request-response-policies/ft-cursor';
import { finalizeScanCursor } from './request-response-policies/scan-cursor';

export type ClusterTopologyRefreshOnReconnectionAttemptStrategy =
  false |
  number |
  ((firstReconnectionAt: number) => false | number | undefined);

type WithCommands<
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
  [P in keyof typeof NON_STICKY_COMMANDS]: CommandSignature<(typeof NON_STICKY_COMMANDS)[P], RESP, TYPE_MAPPING>;
};

interface ClusterCommander<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping,
  // POLICIES extends CommandPolicies
> extends CommanderConfig<M, F, S, RESP> {
  commandOptions?: ClusterCommandOptions<TYPE_MAPPING/*, POLICIES*/>;
  /**
   * Prefix prepended to every key sent to Redis (ioredis-compatible `keyPrefix`).
   *
   * Applied by the cluster client itself; the slot of each command is computed from the
   * prefixed key, so routing stays correct. It is intentionally a cluster-level option
   * (not a per-node `rootNodes`/`defaults` option) so it is applied exactly once.
   *
   * Matches ioredis semantics: only keys *sent* to Redis are prefixed. Keys *returned*
   * by Redis are NOT un-prefixed, `MATCH` patterns are NOT auto-prefixed, and Pub/Sub
   * channels are NOT prefixed.
   */
  keyPrefix?: RedisArgument;
}

export type RedisClusterClientOptions = Omit<
  RedisClientOptions<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping, RedisTcpSocketOptions>,
  keyof ClusterCommander<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping/*, CommandPolicies*/>
>;

export interface RedisClusterOptions<
  M extends RedisModules = RedisModules,
  F extends RedisFunctions = RedisFunctions,
  S extends RedisScripts = RedisScripts,
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = TypeMapping,
  // POLICIES extends CommandPolicies = CommandPolicies
> extends ClusterCommander<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/> {
  /**
   * Should contain details for some of the cluster nodes that the client will use to discover
   * the "cluster topology". We recommend including details for at least 3 nodes here.
   *
   * Note: this configuration is only used for the connections that discover the topology — it is
   * not inherited by the connections made to the discovered nodes. Settings that should apply to
   * every connection (e.g. credentials, TLS) must be specified via `defaults`.
   */
  rootNodes: Array<RedisClusterClientOptions>;
  /**
   * Default values used for every client in the cluster. Use this to specify global values,
   * for example: ACL credentials, timeouts, TLS configuration etc.
   *
   * The connections to the discovered cluster nodes are created from these defaults (plus the
   * discovered host and port) — they do not inherit any other settings from `rootNodes`.
   */
  defaults?: Partial<RedisClusterClientOptions>;
  /**
   * When `true`, `.connect()` will only discover the cluster topology, without actually connecting to all the nodes.
   * Useful for short-term or PubSub-only connections.
   */
  minimizeConnections?: boolean;
  /**
   * When `true`, distribute load by executing readonly commands (such as `GET`, `GEOSEARCH`, etc.) across all cluster nodes. When `false`, only use master nodes.
   */
  // TODO: replicas only mode?
  useReplicas?: boolean;
  /**
   * The maximum number of times a command will be redirected due to `MOVED` or `ASK` errors.
   */
  maxCommandRedirections?: number;
  /**
   * The number of milliseconds after the first post-ready node reconnection attempt
   * before background cluster topology refreshes are triggered. Omitted or `undefined`
   * uses the default delay of `5000`.
   * Use `false` or `0` to disable reconnect-triggered topology refreshes. A function can
   * return the delay dynamically, or `false`/`undefined`/`0` to skip the refresh attempt.
   * Concurrent refreshes are de-duplicated.
   */
  topologyRefreshOnReconnectionAttemptStrategy?: ClusterTopologyRefreshOnReconnectionAttemptStrategy;
  /**
   * Mapping between the addresses in the cluster (see `CLUSTER SHARDS`) and the addresses the client should connect to
   * Useful when the cluster is running on another network
   */
  nodeAddressMap?: NodeAddressMap;
  /**
   * Client Side Caching configuration for the pool.
   *
   * Enables Redis Servers and Clients to work together to cache results from commands
   * sent to a server. The server will notify the client when cached results are no longer valid.
   * In pooled mode, the cache is shared across all clients in the pool.
   *
   * Note: Client Side Caching is only supported with RESP3.
   *
   * @example Anonymous cache configuration
   * ```
   * const client = createCluster({
   *   clientSideCache: {
   *     ttl: 0,
   *     maxEntries: 0,
   *     evictPolicy: "LRU"
   *   },
   *   minimum: 5
   * });
   * ```
   *
   * @example Using a controllable cache
   * ```
   * const cache = new BasicPooledClientSideCache({
   *   ttl: 0,
   *   maxEntries: 0,
   *   evictPolicy: "LRU"
   * });
   * const client = createCluster({
   *   clientSideCache: cache,
   *   minimum: 5
   * });
   * ```
   */
  clientSideCache?: PooledClientSideCacheProvider | ClientSideCacheConfig;
}

export type RedisClusterType<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = {},
  // POLICIES extends CommandPolicies = {}
> = (
  RedisCluster<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/> &
  WithCommands<RESP, TYPE_MAPPING> &
  WithModules<M, RESP, TYPE_MAPPING> &
  WithFunctions<F, RESP, TYPE_MAPPING> &
  WithScripts<S, RESP, TYPE_MAPPING>
);

export type ClusterCommandOptions<
  TYPE_MAPPING extends TypeMapping = TypeMapping
  // POLICIES extends CommandPolicies = CommandPolicies
> = CommandOptions<TYPE_MAPPING>;

type ProxyCluster = RedisCluster<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping>;

type NamespaceProxyCluster = { _self: ProxyCluster };

export default class RedisCluster<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping,
  // POLICIES extends CommandPolicies
> extends EventEmitter {
  static #createCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);

    return async function (this: ProxyCluster, ...args: Array<unknown>) {
      const parser = new BasicCommandParser(this._self._keyPrefix);
      command.parseCommand(parser, ...args);

      return this._self._executeWithPolicies(
        parser,
        command.IS_READ_ONLY,
        this._commandOptions,
        p => (client, opts) => client._executeCommand(command, p, opts, transformReply)
      );
    };
  }

  static #createModuleCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);

    return async function (this: NamespaceProxyCluster, ...args: Array<unknown>) {
      const parser = new BasicCommandParser(this._self._keyPrefix);
      command.parseCommand(parser, ...args);

      return this._self._executeWithPolicies(
        parser,
        command.IS_READ_ONLY,
        this._self._commandOptions,
        p => (client, opts) => client._executeCommand(command, p, opts, transformReply)
      );
    };
  }

  static #createFunctionCommand(name: string, fn: RedisFunction, resp: RespVersions) {
    const prefix = functionArgumentsPrefix(name, fn);
    const transformReply = getTransformReply(fn, resp);

    return async function (this: NamespaceProxyCluster, ...args: Array<unknown>) {
      const parser = new BasicCommandParser(this._self._keyPrefix);
      parser.push(...prefix);
      fn.parseCommand(parser, ...args);

      return this._self._executeWithPolicies(
        parser,
        fn.IS_READ_ONLY,
        this._self._commandOptions,
        p => (client, opts) => client._executeCommand(fn, p, opts, transformReply)
      );
    };
  }

  static #createScriptCommand(script: RedisScript, resp: RespVersions) {
    const prefix = scriptArgumentsPrefix(script);
    const transformReply = getTransformReply(script, resp);

    return async function (this: ProxyCluster, ...args: Array<unknown>) {
      const parser = new BasicCommandParser(this._self._keyPrefix);
      parser.push(...prefix);
      script.parseCommand(parser, ...args);

      return this._self._executeWithPolicies(
        parser,
        script.IS_READ_ONLY,
        this._commandOptions,
        p => (client, opts) => client._executeScript(script, p, opts, transformReply)
      );
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cache stores dynamically generated cluster subclasses
  static #SingleEntryCache = new SingleEntryCache<any, any>();

  static factory<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 3,
    TYPE_MAPPING extends TypeMapping = {},
    // POLICIES extends CommandPolicies = {}
  >(config?: ClusterCommander<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/>) {

    let Cluster = RedisCluster.#SingleEntryCache.get(config);
    if (!Cluster) {
      Cluster = attachConfig({
        BaseClass: RedisCluster,
        commands: NON_STICKY_COMMANDS,
        createCommand: RedisCluster.#createCommand,
        createModuleCommand: RedisCluster.#createModuleCommand,
        createFunctionCommand: RedisCluster.#createFunctionCommand,
        createScriptCommand: RedisCluster.#createScriptCommand,
        config
      });

      Cluster.prototype.Multi = RedisClusterMultiCommand.extend(config);
      RedisCluster.#SingleEntryCache.set(config, Cluster);
    }

    return (options?: Omit<RedisClusterOptions, keyof Exclude<typeof config, undefined>>) => {
      // returning a "proxy" to prevent the namespaces._self to leak between "proxies"
      return Object.create(new Cluster(options)) as RedisClusterType<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/>;
    };
  }

  /**
   * Creates a new Redis Cluster client.
   *
   * Note: `rootNodes` is only used to discover the cluster topology; its configuration is not
   * inherited by the connections made to the discovered nodes. Any setting that should apply to
   * every connection in the cluster (e.g. credentials, TLS) must be specified via `defaults`:
   *
   * @example
   * ```javascript
   * createCluster({
   *   rootNodes: [{ url: 'rediss://external-host.io:30001' }],
   *   defaults: {
   *     password: 'password',
   *     socket: { tls: true }
   *   }
   * });
   * ```
   */
  static create<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 3,
    TYPE_MAPPING extends TypeMapping = {},
    // POLICIES extends CommandPolicies = {}
  >(options?: RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/>) {
    return RedisCluster.factory(options)(options);
  }

  readonly _options: RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/>;

  readonly _slots: RedisClusterSlots<M, F, S, RESP, TYPE_MAPPING>;

  readonly #identity: ClientIdentity;

  private _self = this;
  private _commandOptions?: ClusterCommandOptions<TYPE_MAPPING/*, POLICIES*/>;
  private _policyResolver: PolicyResolver;

  /**
   * An array of the cluster slots, each slot contain its `master` and `replicas`.
   * Use with {@link RedisCluster.prototype.nodeClient} to get the client for a specific node (master or replica).
   */
  get slots() {
    return this._self._slots.slots;
  }

  get clientSideCache() {
    return this._self._slots.clientSideCache;
  }

  /**
   * The configured key prefix (see {@link RedisClusterOptions.keyPrefix}), if any.
   * @internal
   */
  get _keyPrefix(): RedisArgument | undefined {
    return this._self._options.keyPrefix;
  }

  /**
   * An array of the cluster masters.
   * Use with {@link RedisCluster.prototype.nodeClient} to get the client for a specific master node.
   */
  get masters() {
    return this._self._slots.masters;
  }

  /**
   * An array of the cluster replicas.
   * Use with {@link RedisCluster.prototype.nodeClient} to get the client for a specific replica node.
   */
  get replicas() {
    return this._self._slots.replicas;
  }

  /**
   * A map form a node address (`<host>:<port>`) to its shard, each shard contain its `master` and `replicas`.
   * Use with {@link RedisCluster.prototype.nodeClient} to get the client for a specific node (master or replica).
   */
  get nodeByAddress() {
    return this._self._slots.nodeByAddress;
  }

  /**
   * The current pub/sub node.
   */
  get pubSubNode() {
    return this._self._slots.pubSubNode;
  }

  get isOpen() {
    return this._self._slots.isOpen;
  }

  get isReady() {
    return this._self._slots.isReady;
  }

  /**
   * @internal
   * Returns the cluster identity for tracking in metrics.
   */
  get identity(): ClientIdentity {
    return this._self.#identity;
  }

  constructor(options: RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/>) {
    super();

    this.#identity = {
      id: generateClusterClientId(options.rootNodes),
      role: ClientRole.CLUSTER
    };
    this._options = options;
    this._slots = new RedisClusterSlots(options, this.emit.bind(this), this.#identity.id);
    this.on(RESUBSCRIBE_LISTENERS_EVENT, this.resubscribeAllPubSubListeners.bind(this));

    this._commandOptions = { timeout: DEFAULT_COMMAND_TIMEOUT, ...options?.commandOptions };

    // Shared process-wide resolver over the static metadata table. Kept as an
    // instance field so a future per-connection dynamic resolver can replace it.
    this._policyResolver = defaultCommandMetadata;
  }

  duplicate<
    _M extends RedisModules = M,
    _F extends RedisFunctions = F,
    _S extends RedisScripts = S,
    _RESP extends RespVersions = RESP,
    _TYPE_MAPPING extends TypeMapping = TYPE_MAPPING
  >(overrides?: Partial<RedisClusterOptions<_M, _F, _S, _RESP, _TYPE_MAPPING>>) {
    return new (Object.getPrototypeOf(this).constructor)({
      ...this._self._options,
      commandOptions: this._commandOptions,
      ...overrides
    }) as RedisClusterType<_M, _F, _S, _RESP, _TYPE_MAPPING>;
  }

  async connect() {
    await this._self._slots.connect();
    return this as unknown as RedisClusterType<M, F, S, RESP, TYPE_MAPPING>;
  }

  withCommandOptions<
    OPTIONS extends ClusterCommandOptions<TYPE_MAPPING/*, CommandPolicies*/>,
    TYPE_MAPPING extends TypeMapping,
    // POLICIES extends CommandPolicies
  >(options: OPTIONS) {
    const proxy = Object.create(this);
    proxy._commandOptions = options;
    return proxy as RedisClusterType<
      M,
      F,
      S,
      RESP,
      TYPE_MAPPING extends TypeMapping ? TYPE_MAPPING : {}
      // POLICIES extends CommandPolicies ? POLICIES : {}
    >;
  }

  private _commandOptionsProxy<
    K extends keyof ClusterCommandOptions,
    V extends ClusterCommandOptions[K]
  >(
    key: K,
    value: V
  ) {
    const proxy = Object.create(this);
    proxy._commandOptions = { ...this._commandOptions, [key]: value };
    return proxy as RedisClusterType<
      M,
      F,
      S,
      RESP,
      K extends 'typeMapping' ? V extends TypeMapping ? V : {} : TYPE_MAPPING
      // K extends 'policies' ? V extends CommandPolicies ? V : {} : POLICIES
    >;
  }

  /**
   * Override the `typeMapping` command option
   */
  withTypeMapping<TYPE_MAPPING extends TypeMapping>(typeMapping: TYPE_MAPPING) {
    return this._commandOptionsProxy('typeMapping', typeMapping);
  }

  // /**
  //  * Override the `policies` command option
  //  * TODO
  //  */
  // withPolicies<POLICIES extends CommandPolicies> (policies: POLICIES) {
  //   return this._commandOptionsProxy('policies', policies);
  // }

  _handleAsk<T>(
    fn: (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>, opts?: ClusterCommandOptions) => Promise<T>
  ) {
    return async (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>, options?: ClusterCommandOptions) => {
      const chainId = Symbol("asking chain");
      const opts = options ? {...options} : {};
      opts.chainId = chainId;



      const ret = await Promise.all(
        [
          client.sendCommand([ASKING_CMD], {chainId: chainId}),
          fn(client, opts)
        ]
      );

      return ret[1];
    };
  }

  /**
   * Resolves the command's policies and executes it accordingly: the request
   * policy picks the target clients, each target runs through the core
   * `_execute` transport primitive, and the response policy aggregates the
   * replies. Call sites pass a `makeFn` factory that builds the per-client
   * execution closure (command, script, or raw `sendCommand`).
   */
  async _executeWithPolicies<T>(
    parser: CommandParser,
    isReadonly: boolean | undefined,
    options: ClusterCommandOptions | undefined,
    makeFn: (parser: CommandParser) => (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>, opts?: ClusterCommandOptions) => Promise<T>
  ): Promise<T> {
    const policyResult = this._policyResolver.resolvePolicy(parser.commandIdentifier);

    // Commands the resolver doesn't know — user-defined custom commands,
    // scripts/functions, modules absent from the policy table — have no
    // request/response policy and nothing to split or aggregate. Fall back to
    // the default key-routed path (single client by `firstKey`, sole reply
    // passed through) rather than failing. Scripts/functions are single-slot
    // by contract, so default-keyed is always correct for them. Known
    // multi_shard commands that can't be split still throw from the splitter.
    const policy: CommandMetadata = policyResult.ok
      ? policyResult.value
      : defaultCommandPolicies(parser.keys.length === 0);

    // Override-first: a defined `IS_READ_ONLY` (command definition, script, or
    // the raw `sendCommand` caller argument threaded in as `isReadonly`) wins;
    // otherwise the table's write/script_runner flags and keyed-ness decide
    // (see `isReplicaSafe`).
    const readonly = isReplicaSafe(policy, isReadonly);

    const requestPolicy = policy.request
    const responsePolicy = policy.response

    // Fast path: default-keyed request + response — the overwhelming majority
    // of traffic (every single-key command). Route by firstKey and pass the
    // sole reply through, skipping the plan/reducer/post-reply machinery,
    // which is a no-op for this shape (the hooks only concern
    // FT.AGGREGATE/FT.CURSOR/SCAN and the remap only numeric aggregates —
    // none of them default-keyed).
    if (
      requestPolicy === REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED &&
      responsePolicy === RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED
    ) {
      return this._execute(parser, readonly, options, makeFn(parser));
    }

    // https://redis.io/docs/latest/develop/reference/command-tips
    const router = REQUEST_ROUTERS[requestPolicy];
    if (!router) {
      throw new Error(`Unknown request policy ${requestPolicy}`);
    }
    // Routers are typed against the erased base cluster types (routing is
    // below the typed command surface); bridge this instantiation's slots in.
    const plan = await router(
      this._slots as unknown as Parameters<typeof router>[0],
      parser,
      readonly,
      policy.keySpecs
    );

    if (plan.length === 0) {
      throw new Error(`Request policy ${requestPolicy} produced no target nodes`);
    }

    // Numeric aggregation must see raw numbers: strip the caller's type
    // mapping from the per-node executions (a `NUMBER: String` mapping would
    // feed strings into the numeric reducers) and re-apply it to the
    // aggregated result below. Pass-through policies keep the mapping — their
    // replies reach the caller undisturbed.
    const numericAgg = NUMERIC_AGG_POLICIES.has(responsePolicy);
    const requestedMapping = options?.typeMapping;
    const execOptions = numericAgg && requestedMapping
      ? { ...options, typeMapping: undefined }
      : options;

    // Track the actually-serving client for single-target plans: after a
    // MOVED/ASK redirect the reply comes from a different node than
    // `plan[0].client`, and the post-reply hooks must bind cursors to the node
    // that really served. Multi-target hooks are no-ops, so nothing to track.
    const served: { client?: RedisClientType<M, F, S, RESP, TYPE_MAPPING> } = {};
    const responsePromises = plan.map(entry => {
      const entryParser = entry.parser ?? parser;
      // Re-narrow the opaque routed client to this cluster's instantiation.
      const client = entry.client as RedisClientType<M, F, S, RESP, TYPE_MAPPING> | undefined;
      return this._execute(
        entryParser, readonly, execOptions, makeFn(entryParser), client,
        plan.length === 1 ? served : undefined
      );
    });

    const reducer = RESPONSE_REDUCERS[responsePolicy];
    if (!reducer) {
      throw new Error(`Unknown response policy ${responsePolicy}`);
    }
    const positionHints = plan.map(entry => entry.groupIndices);
    let reply = await (reducer(responsePromises, parser, positionHints) as Promise<T>);
    if (numericAgg) {
      reply = remapAggregateReply(reply, requestedMapping);
    }

    // Attribute the reply to the node that actually served it (MOVED/ASK may
    // have redirected away from the plan's original target). The plan carries
    // the erased base client type (routing runs below the typed surface), so
    // widen this instantiation's client back at the boundary.
    const servedClient = served.client as unknown as typeof plan[0]['client'];
    const hookPlan = servedClient && servedClient !== plan[0].client
      ? [{ ...plan[0], client: servedClient }]
      : plan;

    // Sticky-cursor bookkeeping: FT.AGGREGATE/FT.CURSOR bind/rebind/evict the
    // serving node and swap the server cursor id in the reply for a
    // client-minted token (server ids are per-node and can collide across
    // shards). Command-name gated; best-effort — on failure the caller gets
    // the raw server cursor, which MISSes (with a clear error) on the next
    // READ/DEL instead of silently routing to the wrong node.
    try {
      reply = finalizeFtCursor(
        this._slots as unknown as Parameters<typeof finalizeFtCursor>[0],
        parser,
        hookPlan,
        reply
      ) as typeof reply;
    } catch { /* cursor finalization is best-effort */ }

    // Cluster-wide SCAN: advance the scan chain and swap the per-node server
    // cursor for the chain's virtual token. Command-name gated; best-effort —
    // on failure the caller gets the raw server cursor, which MISSes (with a
    // clear error) on the next call instead of silently iterating wrong.
    try {
      reply = finalizeScanCursor(
        this._slots as unknown as Parameters<typeof finalizeScanCursor>[0],
        parser,
        hookPlan,
        reply
      ) as typeof reply;
    } catch { /* scan finalization is best-effort */ }

    return reply;
  }

  /**
   * Core transport primitive: sends one command to one client — resolved by
   * the parser's first key unless `pinnedClient` is given — with MOVED/ASK
   * redirect handling. Policy-free; fan-out and aggregation live in
   * `_executeWithPolicies`.
   */
  async _execute<T>(
    parser: CommandParser,
    isReadonly: boolean | undefined,
    options: ClusterCommandOptions | undefined,
    fn: (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>, opts?: ClusterCommandOptions) => Promise<T>,
    pinnedClient?: RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
    // When given, records the client that actually served the reply — after a
    // MOVED/ASK redirect that differs from the plan's original target, and the
    // post-reply hooks (sticky cursor bindings) must attribute to it.
    served?: { client?: RedisClientType<M, F, S, RESP, TYPE_MAPPING> }
  ): Promise<T> {
      const maxCommandRedirections = this._options.maxCommandRedirections ?? 16;

      // The slot number travels with every attempt (commands-queue
      // `slotNumber`): during an SMIGRATED maintenance event
      // `extractCommandsForSlots` relocates queued commands to the destination
      // node by this value. Pinned plans (default-keyed pins, multi_shard
      // sub-commands) derive it from the parser's first key; keyless fan-outs
      // carry none. The slot of a key never changes, so it is computed once
      // even though MOVED redirects re-resolve the client.
      let client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>;
      let slotNumber: number | undefined;
      if (pinnedClient) {
        client = pinnedClient;
        slotNumber = parser.firstKey === undefined ? undefined : calculateSlot(parser.firstKey);
      } else {
        ({ client, slotNumber } = await this._slots.getClientAndSlotNumber(parser.firstKey, isReadonly));
      }

      let i = 0;

      let myFn = fn;

      while (true) {
        try {
          if (served) served.client = client;
          const opts: ClusterCommandOptions = { ...options, slotNumber };
          return await myFn(client, opts);
        } catch (_err) {
          const err = _err as Error;
          myFn = fn;

          // TODO: error class
          if (++i > maxCommandRedirections || !(err instanceof Error)) {
            if (err instanceof Error) {
              publish(CHANNELS.ERROR, () => ({
                error: err,
                origin: 'cluster',
                internal: false,
                clientId: client._clientId,
                retryCount: i,
              }));
            }
            throw err;
          }

          if (err.message.startsWith('ASK')) {
            publish(CHANNELS.ERROR, () => ({
              error: err,
              origin: 'cluster',
              internal: true,
              clientId: client._clientId,
              retryCount: i,
            }));
            const address = err.message.substring(err.message.lastIndexOf(' ') + 1);
            let redirectTo = await this._slots.getMasterByAddress(address);
            if (!redirectTo) {
              await this._slots.rediscover(client);
              redirectTo = await this._slots.getMasterByAddress(address);
            }

            if (!redirectTo) {
              throw new Error(`Cannot find node ${address}`);
            }

            client = redirectTo;
            myFn = this._handleAsk(fn);
            continue;
          }

          if (err.message.startsWith('MOVED')) {
            publish(CHANNELS.ERROR, () => ({
              error: err,
              origin: 'cluster',
              internal: true,
              clientId: client._clientId,
              retryCount: i,
            }));
            await this._slots.rediscover(client);
            client = (await this._slots.getClientAndSlotNumber(parser.firstKey, isReadonly)).client;
            continue;
          }

          throw err;
        }
      }
  }

  async sendCommand<T = ReplyUnion>(
    firstKey: RedisArgument | undefined,
    isReadonly: boolean | undefined,
    args: CommandArguments,
    options?: ClusterCommandOptions,
    // defaultPolicies?: CommandPolicies
  ): Promise<T> {

    // Merge global options with local options
    const opts = {
      ...this._commandOptions,
      ...options
    }

    // `args` is the full command as sent on the wire (name at index 0), so it
    // becomes `redisArgs` verbatim — policy resolution reads the command name
    // and the multi_shard splitter's key-spec offsets line up. The caller's
    // `firstKey` is marked for routing without re-appending it.
    const parser = new BasicCommandParser();
    args.forEach(arg => parser.push(arg));
    if (firstKey !== undefined) parser.markRoutingKey(firstKey);

    // Raw path: no command object, so readonly-ness stays an explicit caller
    // argument and the reply is returned untransformed. The closure sends the
    // per-entry parser's args, so split multi_shard sub-commands each carry
    // their own slot's arguments (and the unsplit case sends `args` unchanged).
    return this._self._executeWithPolicies(
      parser,
      isReadonly,
      opts,
      p => (client, opts) => client.sendCommand(p.redisArgs as CommandArguments, opts)
    );
  }

  MULTI(routing?: RedisArgument) {
    type Multi = new (...args: ConstructorParameters<typeof RedisClusterMultiCommand>) => RedisClusterMultiCommandType<[], M, F, S, RESP, TYPE_MAPPING>;
    return new (this as this & { Multi: Multi }).Multi(
      async (firstKey, isReadonly, commands) => {
        const { client } = await this._self._slots.getClientAndSlotNumber(firstKey, isReadonly);
        return client._executeMulti(commands);
      },
      async (firstKey, isReadonly, commands) => {
        const { client } = await this._self._slots.getClientAndSlotNumber(firstKey, isReadonly);
        return client._executePipeline(commands);
      },
      routing,
      this._commandOptions?.typeMapping,
      this._self._keyPrefix
    );
  }

  multi = this.MULTI;

  async SUBSCRIBE<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return (await this._self._slots.getPubSubClient())
      .SUBSCRIBE(channels, listener, bufferMode);
  }

  subscribe = this.SUBSCRIBE;

  async UNSUBSCRIBE<T extends boolean = false>(
    channels?: string | Array<string>,
    listener?: PubSubListener<boolean>,
    bufferMode?: T
  ) {
    return this._self._slots.executeUnsubscribeCommand(client =>
      client.UNSUBSCRIBE(channels, listener, bufferMode)
    );
  }

  unsubscribe = this.UNSUBSCRIBE;

  async PSUBSCRIBE<T extends boolean = false>(
    patterns: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return (await this._self._slots.getPubSubClient())
      .PSUBSCRIBE(patterns, listener, bufferMode);
  }

  pSubscribe = this.PSUBSCRIBE;

  async PUNSUBSCRIBE<T extends boolean = false>(
    patterns?: string | Array<string>,
    listener?: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this._self._slots.executeUnsubscribeCommand(client =>
      client.PUNSUBSCRIBE(patterns, listener, bufferMode)
    );
  }

  pUnsubscribe = this.PUNSUBSCRIBE;

  async SSUBSCRIBE<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    const maxCommandRedirections = this._self._options.maxCommandRedirections ?? 16,
      firstChannel = Array.isArray(channels) ? channels[0] : channels;
    let client = await this._self._slots.getShardedPubSubClient(firstChannel);
    for (let i = 0; ; i++) {
      try {
        return await client.SSUBSCRIBE(channels, listener, bufferMode);
      } catch (err) {
        if (++i > maxCommandRedirections || !(err instanceof ErrorReply)) {
          throw err;
        }

        if (err.message.startsWith('MOVED')) {
          await this._self._slots.rediscover(client);
          client = await this._self._slots.getShardedPubSubClient(firstChannel);
          continue;
        }

        throw err;
      }
    }
  }

  sSubscribe = this.SSUBSCRIBE;

  SUNSUBSCRIBE<T extends boolean = false>(
    channels: string | Array<string>,
    listener?: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this._self._slots.executeShardedUnsubscribeCommand(
      Array.isArray(channels) ? channels[0] : channels,
      client => client.SUNSUBSCRIBE(channels, listener, bufferMode)
    );
  }

  resubscribeAllPubSubListeners(allListeners: Partial<PubSubListeners>) {
    if (allListeners.CHANNELS) {
      for(const [channel, listeners] of allListeners.CHANNELS) {
        listeners.buffers.forEach(bufListener => {
          this.subscribe(channel, bufListener, true);
        });
        listeners.strings.forEach(strListener => {
          this.subscribe(channel, strListener);
        });
      }
    }

    if (allListeners.PATTERNS) {
      for (const [channel, listeners] of allListeners.PATTERNS) {
        listeners.buffers.forEach(bufListener => {
          this.pSubscribe(channel, bufListener, true);
        });
        listeners.strings.forEach(strListener => {
          this.pSubscribe(channel, strListener);
        });
      }
    }

    if (allListeners.SHARDED) {
      for (const [channel, listeners] of allListeners.SHARDED) {
        listeners.buffers.forEach(bufListener => {
          this.sSubscribe(channel, bufListener, true);
        });
        listeners.strings.forEach(strListener => {
          this.sSubscribe(channel, strListener);
        });
      }
    }
  }

  sUnsubscribe = this.SUNSUBSCRIBE;

  /**
   * @deprecated Use `close` instead.
   */
  quit() {
    return this._self._slots.quit();
  }

  /**
   * @deprecated Use `destroy` instead.
   */
  disconnect() {
    return this._self._slots.disconnect();
  }

  close() {
    this._self._slots.clientSideCache?.onPoolClose();
    return this._self._slots.close();
  }

  destroy() {
    this._self._slots.clientSideCache?.onPoolClose();
    return this._self._slots.destroy();
  }

  nodeClient(node: ShardNode<M, F, S, RESP, TYPE_MAPPING>) {
    return this._self._slots.nodeClient(node);
  }

  /**
   * Returns a random node from the cluster.
   * Userful for running "forward" commands (like PUBLISH) on a random node.
   */
  getRandomNode() {
    return this._self._slots.getRandomNode();
  }

  /**
   * Get a random node from a slot.
   * Useful for running readonly commands on a slot.
   */
  getSlotRandomNode(slot: number) {
    return this._self._slots.getSlotRandomNode(slot);
  }

  /**
   * Returns the connected node client responsible for the given key's slot.
   * Useful for connection-level operations that the cluster client does not expose
   * directly, such as `WATCH` followed by `MULTI`/`EXEC`:
   *
   * ```javascript
   * const nodeClient = await cluster.getNodeClientForKey(key);
   * await nodeClient.WATCH(key);
   * const value = await nodeClient.GET(key);
   * const reply = await nodeClient.MULTI()
   *   .SET(key, calculateNewValue(value))
   *   .EXEC(); // `null` if `key` changed, retry
   * ```
   *
   * @param key - The key whose slot determines the node.
   * @param isReadonly - If `true`, may return a replica client; otherwise returns the slot master.
   */
  getNodeClientForKey(key: RedisArgument, isReadonly?: boolean) {
    return this._self._slots.getClientForKey(key, isReadonly);
  }

  /**
   * @deprecated use `.masters` instead
   * TODO
   */
  getMasters() {
    return this.masters;
  }

  /**
   * @deprecated use `.slots[<SLOT>]` instead
   * TODO
   */
  getSlotMaster(slot: number) {
    return this.slots[slot].master;
  }
}
