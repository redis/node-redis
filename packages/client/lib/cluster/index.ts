import COMMANDS from "./commands";
import {
  ValkeyCommand,
  ValkeyCommandArgument,
  ValkeyCommandArguments,
  ValkeyCommandRawReply,
  ValkeyCommandReply,
  ValkeyFunctions,
  ValkeyModules,
  ValkeyExtensions,
  ValkeyScript,
  ValkeyScripts,
  ValkeyCommandSignature,
  ValkeyFunction,
} from "../commands";
import {
  ClientCommandOptions,
  ValkeyClientOptions,
  ValkeyClientType,
  WithFunctions,
  WithModules,
  WithScripts,
} from "../client";
import ValkeyClusterSlots, { NodeAddressMap, ShardNode } from "./cluster-slots";
import {
  attachExtensions,
  transformCommandReply,
  attachCommands,
  transformCommandArguments,
} from "../commander";
import { EventEmitter } from "events";
import ValkeyClusterMultiCommand, {
  InstantiableValkeyClusterMultiCommandType,
  ValkeyClusterMultiCommandType,
} from "./multi-command";
import { ValkeyMultiQueuedCommand } from "../multi-command";
import { PubSubListener } from "../client/pub-sub";
import { ErrorReply } from "../errors";

export type ValkeyClusterClientOptions = Omit<
  ValkeyClientOptions,
  "modules" | "functions" | "scripts" | "database"
>;

export interface ValkeyClusterOptions<
  M extends ValkeyModules = Record<string, never>,
  F extends ValkeyFunctions = Record<string, never>,
  S extends ValkeyScripts = Record<string, never>
> extends ValkeyExtensions<M, F, S> {
  /**
   * Should contain details for some of the cluster nodes that the client will use to discover
   * the "cluster topology". We recommend including details for at least 3 nodes here.
   */
  rootNodes: Array<ValkeyClusterClientOptions>;
  /**
   * Default values used for every client in the cluster. Use this to specify global values,
   * for example: ACL credentials, timeouts, TLS configuration etc.
   */
  defaults?: Partial<ValkeyClusterClientOptions>;
  /**
   * When `true`, `.connect()` will only discover the cluster topology, without actually connecting to all the nodes.
   * Useful for short-term or PubSub-only connections.
   */
  minimizeConnections?: boolean;
  /**
   * When `true`, distribute load by executing readonly commands (such as `GET`, `GEOSEARCH`, etc.) across all cluster nodes. When `false`, only use master nodes.
   */
  useReplicas?: boolean;
  /**
   * The maximum number of times a command will be redirected due to `MOVED` or `ASK` errors.
   */
  maxCommandRedirections?: number;
  /**
   * Mapping between the addresses in the cluster (see `CLUSTER SHARDS`) and the addresses the client should connect to
   * Useful when the cluster is running on another network
   *
   */
  nodeAddressMap?: NodeAddressMap;
}

type WithCommands = {
  [P in keyof typeof COMMANDS]: ValkeyCommandSignature<(typeof COMMANDS)[P]>;
};

export type ValkeyClusterType<
  M extends ValkeyModules = Record<string, never>,
  F extends ValkeyFunctions = Record<string, never>,
  S extends ValkeyScripts = Record<string, never>
> = ValkeyCluster<M, F, S> &
  WithCommands &
  WithModules<M> &
  WithFunctions<F> &
  WithScripts<S>;

export default class ValkeyCluster<
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
> extends EventEmitter {
  static extractFirstKey(
    command: ValkeyCommand,
    originalArgs: Array<unknown>,
    valkeyArgs: ValkeyCommandArguments
  ): ValkeyCommandArgument | undefined {
    if (command.FIRST_KEY_INDEX === undefined) {
      return undefined;
    } else if (typeof command.FIRST_KEY_INDEX === "number") {
      return valkeyArgs[command.FIRST_KEY_INDEX];
    }

    return command.FIRST_KEY_INDEX(...originalArgs);
  }

  static create<
    M extends ValkeyModules,
    F extends ValkeyFunctions,
    S extends ValkeyScripts
  >(options?: ValkeyClusterOptions<M, F, S>): ValkeyClusterType<M, F, S> {
    return new (attachExtensions({
      BaseClass: ValkeyCluster,
      modulesExecutor: ValkeyCluster.prototype.commandsExecutor,
      modules: options?.modules,
      functionsExecutor: ValkeyCluster.prototype.functionsExecutor,
      functions: options?.functions,
      scriptsExecutor: ValkeyCluster.prototype.scriptsExecutor,
      scripts: options?.scripts,
    }))(options);
  }

  readonly #options: ValkeyClusterOptions<M, F, S>;

  readonly #slots: ValkeyClusterSlots<M, F, S>;

  get slots() {
    return this.#slots.slots;
  }

  get shards() {
    return this.#slots.shards;
  }

  get masters() {
    return this.#slots.masters;
  }

  get replicas() {
    return this.#slots.replicas;
  }

  get nodeByAddress() {
    return this.#slots.nodeByAddress;
  }

  get pubSubNode() {
    return this.#slots.pubSubNode;
  }

  readonly #Multi: InstantiableValkeyClusterMultiCommandType<M, F, S>;

  get isOpen() {
    return this.#slots.isOpen;
  }

  constructor(options: ValkeyClusterOptions<M, F, S>) {
    super();

    this.#options = options;
    this.#slots = new ValkeyClusterSlots(options, this.emit.bind(this));
    this.#Multi = ValkeyClusterMultiCommand.extend(options);
  }

  duplicate(
    overrides?: Partial<ValkeyClusterOptions<M, F, S>>
  ): ValkeyClusterType<M, F, S> {
    return new (Object.getPrototypeOf(this).constructor)({
      ...this.#options,
      ...overrides,
    });
  }

  connect() {
    return this.#slots.connect();
  }

  async commandsExecutor<C extends ValkeyCommand>(
    command: C,
    args: Array<unknown>
  ): Promise<ValkeyCommandReply<C>> {
    const {
      jsArgs,
      args: valkeyArgs,
      options,
    } = transformCommandArguments(command, args);
    return transformCommandReply(
      command,
      await this.sendCommand(
        ValkeyCluster.extractFirstKey(command, jsArgs, valkeyArgs),
        command.IS_READ_ONLY,
        valkeyArgs,
        options
      ),
      valkeyArgs.preserve
    );
  }

  async sendCommand<T = ValkeyCommandRawReply>(
    firstKey: ValkeyCommandArgument | undefined,
    isReadonly: boolean | undefined,
    args: ValkeyCommandArguments,
    options?: ClientCommandOptions
  ): Promise<T> {
    return this.#execute(firstKey, isReadonly, (client) =>
      client.sendCommand<T>(args, options)
    );
  }

  async functionsExecutor<F extends ValkeyFunction>(
    fn: F,
    args: Array<unknown>,
    name: string
  ): Promise<ValkeyCommandReply<F>> {
    const { args: valkeyArgs, options } = transformCommandArguments(fn, args);
    return transformCommandReply(
      fn,
      await this.executeFunction(name, fn, args, valkeyArgs, options),
      valkeyArgs.preserve
    );
  }

  async executeFunction(
    name: string,
    fn: ValkeyFunction,
    originalArgs: Array<unknown>,
    valkeyArgs: ValkeyCommandArguments,
    options?: ClientCommandOptions
  ): Promise<ValkeyCommandRawReply> {
    return this.#execute(
      ValkeyCluster.extractFirstKey(fn, originalArgs, valkeyArgs),
      fn.IS_READ_ONLY,
      (client) => client.executeFunction(name, fn, valkeyArgs, options)
    );
  }

  async scriptsExecutor<S extends ValkeyScript>(
    script: S,
    args: Array<unknown>
  ): Promise<ValkeyCommandReply<S>> {
    const { args: valkeyArgs, options } = transformCommandArguments(
      script,
      args
    );
    return transformCommandReply(
      script,
      await this.executeScript(script, args, valkeyArgs, options),
      valkeyArgs.preserve
    );
  }

  async executeScript(
    script: ValkeyScript,
    originalArgs: Array<unknown>,
    valkeyArgs: ValkeyCommandArguments,
    options?: ClientCommandOptions
  ): Promise<ValkeyCommandRawReply> {
    return this.#execute(
      ValkeyCluster.extractFirstKey(script, originalArgs, valkeyArgs),
      script.IS_READ_ONLY,
      (client) => client.executeScript(script, valkeyArgs, options)
    );
  }

  async #execute<Reply>(
    firstKey: ValkeyCommandArgument | undefined,
    isReadonly: boolean | undefined,
    executor: (client: ValkeyClientType<M, F, S>) => Promise<Reply>
  ): Promise<Reply> {
    const maxCommandRedirections = this.#options.maxCommandRedirections ?? 16;
    let client = await this.#slots.getClient(firstKey, isReadonly);
    for (let i = 0; ; i++) {
      try {
        return await executor(client);
      } catch (err) {
        if (++i > maxCommandRedirections || !(err instanceof ErrorReply)) {
          throw err;
        }

        if (err.message.startsWith("ASK")) {
          const address = err.message.substring(
            err.message.lastIndexOf(" ") + 1
          );
          let redirectTo = await this.#slots.getMasterByAddress(address);
          if (!redirectTo) {
            await this.#slots.rediscover(client);
            redirectTo = await this.#slots.getMasterByAddress(address);
          }

          if (!redirectTo) {
            throw new Error(`Cannot find node ${address}`);
          }

          await redirectTo.asking();
          client = redirectTo;
          continue;
        } else if (err.message.startsWith("MOVED")) {
          await this.#slots.rediscover(client);
          client = await this.#slots.getClient(firstKey, isReadonly);
          continue;
        }

        throw err;
      }
    }
  }

  MULTI(
    routing?: ValkeyCommandArgument
  ): ValkeyClusterMultiCommandType<M, F, S> {
    return new this.#Multi(
      (
        commands: Array<ValkeyMultiQueuedCommand>,
        firstKey?: ValkeyCommandArgument,
        chainId?: symbol
      ) => {
        return this.#execute(firstKey, false, (client) =>
          client.multiExecutor(commands, undefined, chainId)
        );
      },
      routing
    );
  }

  multi = this.MULTI;

  async SUBSCRIBE<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return (await this.#slots.getPubSubClient()).SUBSCRIBE(
      channels,
      listener,
      bufferMode
    );
  }

  subscribe = this.SUBSCRIBE;

  async UNSUBSCRIBE<T extends boolean = false>(
    channels?: string | Array<string>,
    listener?: PubSubListener<boolean>,
    bufferMode?: T
  ) {
    return this.#slots.executeUnsubscribeCommand((client) =>
      client.UNSUBSCRIBE(channels, listener, bufferMode)
    );
  }

  unsubscribe = this.UNSUBSCRIBE;

  async PSUBSCRIBE<T extends boolean = false>(
    patterns: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return (await this.#slots.getPubSubClient()).PSUBSCRIBE(
      patterns,
      listener,
      bufferMode
    );
  }

  pSubscribe = this.PSUBSCRIBE;

  async PUNSUBSCRIBE<T extends boolean = false>(
    patterns?: string | Array<string>,
    listener?: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.#slots.executeUnsubscribeCommand((client) =>
      client.PUNSUBSCRIBE(patterns, listener, bufferMode)
    );
  }

  pUnsubscribe = this.PUNSUBSCRIBE;

  async SSUBSCRIBE<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    const maxCommandRedirections = this.#options.maxCommandRedirections ?? 16,
      firstChannel = Array.isArray(channels) ? channels[0] : channels;
    let client = await this.#slots.getShardedPubSubClient(firstChannel);
    for (let i = 0; ; i++) {
      try {
        return await client.SSUBSCRIBE(channels, listener, bufferMode);
      } catch (err) {
        if (++i > maxCommandRedirections || !(err instanceof ErrorReply)) {
          throw err;
        }

        if (err.message.startsWith("MOVED")) {
          await this.#slots.rediscover(client);
          client = await this.#slots.getShardedPubSubClient(firstChannel);
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
    return this.#slots.executeShardedUnsubscribeCommand(
      Array.isArray(channels) ? channels[0] : channels,
      (client) => client.SUNSUBSCRIBE(channels, listener, bufferMode)
    );
  }

  sUnsubscribe = this.SUNSUBSCRIBE;

  quit(): Promise<void> {
    return this.#slots.quit();
  }

  disconnect(): Promise<void> {
    return this.#slots.disconnect();
  }

  nodeClient(node: ShardNode<M, F, S>) {
    return this.#slots.nodeClient(node);
  }

  getRandomNode() {
    return this.#slots.getRandomNode();
  }

  getSlotRandomNode(slot: number) {
    return this.#slots.getSlotRandomNode(slot);
  }

  /**
   * @deprecated use `.masters` instead
   */
  getMasters() {
    return this.masters;
  }

  /**
   * @deprecated use `.slots[<SLOT>]` instead
   */
  getSlotMaster(slot: number) {
    return this.slots[slot].master;
  }
}

attachCommands({
  BaseClass: ValkeyCluster,
  commands: COMMANDS,
  executor: ValkeyCluster.prototype.commandsExecutor,
});
