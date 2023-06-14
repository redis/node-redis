import { RedisClientOptions } from '../client';
import { CommandOptions } from '../client/commands-queue';
import { Command, CommandArguments, CommanderConfig, CommandPolicies, CommandWithPoliciesSignature, TypeMapping, RedisArgument, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts, ReplyUnion, RespVersions } from '../RESP/types';
import COMMANDS from '../commands';
import { EventEmitter } from 'events';
import { attachConfig, functionArgumentsPrefix, getTransformReply, scriptArgumentsPrefix } from '../commander';
import RedisClusterSlots, { NodeAddressMap, ShardNode } from './cluster-slots';
import RedisClusterMultiCommand, { RedisClusterMultiCommandType } from './multi-command';
import { RedisMultiQueuedCommand } from '../multi-command';
import { PubSubListener } from '../client/pub-sub';
import { ErrorReply } from '../errors';

export type RedisClusterClientOptions = Omit<
  RedisClientOptions,
  'modules' | 'functions' | 'scripts' | 'database' | 'RESP'
>;

export interface RedisClusterOptions<
  M extends RedisModules = RedisModules,
  F extends RedisFunctions = RedisFunctions,
  S extends RedisScripts = RedisScripts,
  RESP extends RespVersions = RespVersions
> extends CommanderConfig<M, F, S, RESP> {
  /**
   * Should contain details for some of the cluster nodes that the client will use to discover 
   * the "cluster topology". We recommend including details for at least 3 nodes here.
   */
  rootNodes: Array<RedisClusterClientOptions>;
  /**
   * Default values used for every client in the cluster. Use this to specify global values, 
   * for example: ACL credentials, timeouts, TLS configuration etc.
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
   * Mapping between the addresses in the cluster (see `CLUSTER SHARDS`) and the addresses the client should connect to
   * Useful when the cluster is running on another network
   */
  nodeAddressMap?: NodeAddressMap;
}

type WithCommands<
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping,
  POLICIES extends CommandPolicies
> = {
  [P in keyof typeof COMMANDS]: CommandWithPoliciesSignature<(typeof COMMANDS)[P], RESP, TYPE_MAPPING, POLICIES>;
};

export type RedisClusterType<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {},
  POLICIES extends CommandPolicies = {}
> = RedisCluster<M, F, S, RESP, TYPE_MAPPING, POLICIES> & WithCommands<RESP, TYPE_MAPPING, POLICIES>;
// & WithModules<M> & WithFunctions<F> & WithScripts<S>

export interface ClusterCommandOptions extends CommandOptions {
  policies?: CommandPolicies;
}

type ProxyCluster = RedisCluster<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping, CommandPolicies> & { commandOptions?: ClusterCommandOptions };

type NamespaceProxyCluster = { self: ProxyCluster };

export default class RedisCluster<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping,
  POLICIES extends CommandPolicies
> extends EventEmitter {
  static extractFirstKey<C extends Command>(
    command: C,
    args: Parameters<C['transformArguments']>,
    redisArgs: Array<RedisArgument>
  ): RedisArgument | undefined {
    if (command.FIRST_KEY_INDEX === undefined) {
      return undefined;
    } else if (typeof command.FIRST_KEY_INDEX === 'number') {
      return redisArgs[command.FIRST_KEY_INDEX];
    }

    return command.FIRST_KEY_INDEX(...args);
  }

  private static _createCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: ProxyCluster, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        firstKey = RedisCluster.extractFirstKey(
          command,
          args,
          redisArgs
        ),
        reply = await this.sendCommand(
          firstKey,
          command.IS_READ_ONLY,
          redisArgs,
          this.commandOptions,
          command.POLICIES
        );

      return transformReply ?
        transformReply(reply, redisArgs.preserve) :
        reply;
    };
  }

  private static _createModuleCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: NamespaceProxyCluster, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        firstKey = RedisCluster.extractFirstKey(
          command,
          args,
          redisArgs
        ),
        reply = await this.self.sendCommand(
          firstKey,
          command.IS_READ_ONLY,
          redisArgs,
          this.self.commandOptions,
          command.POLICIES
        );

      return transformReply ?
        transformReply(reply, redisArgs.preserve) :
        reply;
    };
  }

  private static _createFunctionCommand(name: string, fn: RedisFunction, resp: RespVersions) {
    const prefix = functionArgumentsPrefix(name, fn),
      transformReply = getTransformReply(fn, resp);
    return async function (this: NamespaceProxyCluster, ...args: Array<unknown>) {
      const fnArgs = fn.transformArguments(...args),
        redisArgs = prefix.concat(fnArgs),
        firstKey = RedisCluster.extractFirstKey(
          fn,
          fnArgs,
          redisArgs
        ),
        reply = await this.self.sendCommand(
          firstKey,
          fn.IS_READ_ONLY,
          redisArgs,
          this.self.commandOptions,
          fn.POLICIES
        );

      return transformReply ?
        transformReply(reply, fnArgs.preserve) :
        reply;
    };
  }

  private static _createScriptCommand(script: RedisScript, resp: RespVersions) {
    const prefix = scriptArgumentsPrefix(script),
      transformReply = getTransformReply(script, resp);
    return async function (this: ProxyCluster, ...args: Array<unknown>) {
      const scriptArgs = script.transformArguments(...args),
        redisArgs = prefix.concat(scriptArgs),
        firstKey = RedisCluster.extractFirstKey(
          script,
          scriptArgs,
          redisArgs
        ),
        reply = await this.sendCommand(
          firstKey,
          script.IS_READ_ONLY,
          redisArgs,
          this.commandOptions,
          script.POLICIES
        );

      return transformReply ?
        transformReply(reply, scriptArgs.preserve) :
        reply;
    };
  }

  static factory<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2
  >(config?: CommanderConfig<M, F, S, RESP>) {
    const Cluster = attachConfig({
      BaseClass: RedisCluster,
      commands: COMMANDS,
      createCommand: RedisCluster._createCommand,
      createFunctionCommand: RedisCluster._createFunctionCommand,
      createModuleCommand: RedisCluster._createModuleCommand,
      createScriptCommand: RedisCluster._createScriptCommand,
      config
    });

    Cluster.prototype.Multi = RedisClusterMultiCommand.extend(config);

    return (options?: Omit<RedisClusterOptions, keyof Exclude<typeof config, undefined>>) => {
      // returning a proxy of the client to prevent the namespaces.self to leak between proxies
      // namespaces will be bootstraped on first access per proxy
      return Object.create(new Cluster(options)) as RedisClusterType<M, F, S, RESP>;
    };
  }

  static create<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2
  >(options?: RedisClusterOptions<M, F, S, RESP>) {
    return RedisCluster.factory(options)(options);
  }

  private readonly _options: RedisClusterOptions<M, F, S, RESP>;

  private readonly _slots: RedisClusterSlots<M, F, S, RESP>;

  /**
   * An array of the cluster slots, each slot contain its `master` and `replicas`.
   * Use with {@link RedisCluster.prototype.nodeClient} to get the client for a specific node (master or replica).
   */
  get slots() {
    return this._slots.slots;
  }

  /**
   * An array of cluster shards, each shard contain its `master` and `replicas`.
   * Use with {@link RedisCluster.prototype.nodeClient} to get the client for a specific node (master or replica).
   */
  get shards() {
    return this._slots.shards;
  }

  /**
   * An array of the cluster masters.
   * Use with {@link RedisCluster.prototype.nodeClient} to get the client for a specific master node.
   */
  get masters() {
    return this._slots.masters;
  }

  /**
   * An array of the cluster replicas.
   * Use with {@link RedisCluster.prototype.nodeClient} to get the client for a specific replica node.
   */
  get replicas() {
    return this._slots.replicas;
  }

  /**
   * A map form a node address (`<host>:<port>`) to its shard, each shard contain its `master` and `replicas`.
   * Use with {@link RedisCluster.prototype.nodeClient} to get the client for a specific node (master or replica).
   */
  get nodeByAddress() {
    return this._slots.nodeByAddress;
  }

  /**
   * The current pub/sub node.
   */
  get pubSubNode() {
    return this._slots.pubSubNode;
  }

  get isOpen() {
    return this._slots.isOpen;
  }

  constructor(options: RedisClusterOptions<M, F, S, RESP>) {
    super();

    this._options = options;
    this._slots = new RedisClusterSlots(options, this.emit.bind(this));
  }

  duplicate(overrides?: Partial<RedisClusterOptions<M, F, S>>): RedisClusterType<M, F, S> {
    return new (Object.getPrototypeOf(this).constructor)({
      ...this._options,
      ...overrides
    });
  }

  connect() {
    return this._slots.connect();
  }

  withCommandOptions<T extends ClusterCommandOptions>(options: T) {
    const proxy = Object.create(this);
    proxy.commandOptions = options;
    return proxy as RedisClusterType<
      M,
      F,
      S,
      RESP,
      T['typeMapping'] extends TypeMapping ? T['typeMapping'] : {},
      T['policies'] extends CommandPolicies ? T['policies'] : {}
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
    proxy.commandOptions = Object.create((this as unknown as ProxyCluster).commandOptions ?? null);
    proxy.commandOptions[key] = value;
    return proxy as RedisClusterType<
      M,
      F, 
      S,
      RESP,
      K extends 'typeMapping' ? V extends TypeMapping ? V : {} : TYPE_MAPPING,
      K extends 'policies' ? V extends CommandPolicies ? V : {} : POLICIES
    >;
  }

  /**
   * Override the `typeMapping` command option
   */
  withTypeMapping<TYPE_MAPPING extends TypeMapping>(typeMapping: TYPE_MAPPING) {
    return this._commandOptionsProxy('typeMapping', typeMapping);
  }

  /**
   * Override the `policies` command option
   * TODO
   */
  withPolicies<POLICIES extends CommandPolicies> (policies: POLICIES) {
    return this._commandOptionsProxy('policies', policies);
  }

  async sendCommand<T = ReplyUnion>(
    firstKey: RedisArgument | undefined,
    isReadonly: boolean | undefined,
    args: CommandArguments,
    options?: ClusterCommandOptions,
    deafultPolicies?: CommandPolicies
  ): Promise<T> {
    // const requestPolicy = options?.policies?.request ?? deafultPolicies?.request,
    //   responsePolicy = options?.policies?.response ?? deafultPolicies?.response;

    const maxCommandRedirections = this._options.maxCommandRedirections ?? 16;
    let client = await this._slots.getClient(firstKey, isReadonly);
    for (let i = 0; ; i++) {
      try {
        return await client.sendCommand<T>(args, options);
      } catch (err) {
        // TODO: error class
        if (++i > maxCommandRedirections || !(err instanceof Error)) {
          throw err;
        }

        if (err.message.startsWith('ASK')) {
          const address = err.message.substring(err.message.lastIndexOf(' ') + 1);
          let redirectTo = await this._slots.getMasterByAddress(address);
          if (!redirectTo) {
            await this._slots.rediscover(client);
            redirectTo = await this._slots.getMasterByAddress(address);
          }

          if (!redirectTo) {
            throw new Error(`Cannot find node ${address}`);
          }

          await redirectTo.asking();
          client = redirectTo;
          continue;
        } else if (err.message.startsWith('MOVED')) {
          await this._slots.rediscover(client);
          client = await this._slots.getClient(firstKey, isReadonly);
          continue;
        }

        throw err;
      }
    }
  }

  /**
   * @internal
   */
  async executePipeline(
    firstKey: RedisArgument | undefined,
    isReadonly: boolean | undefined,
    commands: Array<RedisMultiQueuedCommand>
  ) {
    const client = await this._slots.getClient(firstKey, isReadonly);
    return client.executePipeline(commands);
  }

  /**
   * @internal
   */
  async executeMulti(
    firstKey: RedisArgument | undefined,
    isReadonly: boolean | undefined,
    commands: Array<RedisMultiQueuedCommand>
  ) {
    const client = await this._slots.getClient(firstKey, isReadonly);
    return client.executeMulti(commands);
  }

  MULTI(routing?: RedisArgument): RedisClusterMultiCommandType<[], M, F, S, RESP, TYPE_MAPPING> {
    return new (this as any).Multi(
      this,
      routing
    );
  }

  multi = this.MULTI;

  async SUBSCRIBE<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return (await this._slots.getPubSubClient())
      .SUBSCRIBE(channels, listener, bufferMode);
  }

  subscribe = this.SUBSCRIBE;

  async UNSUBSCRIBE<T extends boolean = false>(
    channels?: string | Array<string>,
    listener?: PubSubListener<boolean>,
    bufferMode?: T
  ) {
    return this._slots.executeUnsubscribeCommand(client =>
      client.UNSUBSCRIBE(channels, listener, bufferMode)
    );
  }

  unsubscribe = this.UNSUBSCRIBE;

  async PSUBSCRIBE<T extends boolean = false>(
    patterns: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return (await this._slots.getPubSubClient())
      .PSUBSCRIBE(patterns, listener, bufferMode);
  }

  pSubscribe = this.PSUBSCRIBE;

  async PUNSUBSCRIBE<T extends boolean = false>(
    patterns?: string | Array<string>,
    listener?: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this._slots.executeUnsubscribeCommand(client =>
      client.PUNSUBSCRIBE(patterns, listener, bufferMode)
    );
  }

  pUnsubscribe = this.PUNSUBSCRIBE;

  async SSUBSCRIBE<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    const maxCommandRedirections = this._options.maxCommandRedirections ?? 16,
      firstChannel = Array.isArray(channels) ? channels[0] : channels;
    let client = await this._slots.getShardedPubSubClient(firstChannel);
    for (let i = 0; ; i++) {
      try {
        return await client.SSUBSCRIBE(channels, listener, bufferMode);
      } catch (err) {
        if (++i > maxCommandRedirections || !(err instanceof ErrorReply)) {
          throw err;
        }

        if (err.message.startsWith('MOVED')) {
          await this._slots.rediscover(client);
          client = await this._slots.getShardedPubSubClient(firstChannel);
          continue;
        }

        throw err;
      }
    }
  }

  sSubscribe = this.SSUBSCRIBE;

  SUNSUBSCRIBE<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this._slots.executeShardedUnsubscribeCommand(
      Array.isArray(channels) ? channels[0] : channels,
      client => client.SUNSUBSCRIBE(channels, listener, bufferMode)
    );
  }

  sUnsubscribe = this.SUNSUBSCRIBE;

  /**
   * @deprecated Use `close` instead.
   */
  quit() {
    return this._slots.quit();
  }

  /**
   * @deprecated Use `destroy` instead.
   */
  disconnect() {
    return this._slots.disconnect();
  }

  close() {
    return this._slots.close();
  }

  destroy() {
    return this._slots.destroy();
  }

  nodeClient(node: ShardNode<M, F, S, RESP>) {
    return this._slots.nodeClient(node);
  }

  /**
   * Returns a random node from the cluster.
   * Userful for running "forward" commands (like PUBLISH) on a random node.
   */
  getRandomNode() {
    return this._slots.getRandomNode();
  }

  /**
   * Get a random node from a slot.
   * Useful for running readonly commands on a slot.
   */
  getSlotRandomNode(slot: number) {
    return this._slots.getSlotRandomNode(slot);
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
