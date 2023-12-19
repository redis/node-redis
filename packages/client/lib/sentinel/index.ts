import { EventEmitter } from 'node:events';
import { Command, CommandArguments, RedisArgument, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts, ReplyUnion, RespVersions, TypeMapping } from '../RESP/types';
import RedisClient, { RedisClientOptions, RedisClientType } from '../client';
import { CommandOptions } from '../client/commands-queue';
import { attachConfig, functionArgumentsPrefix, getTransformReply, scriptArgumentsPrefix } from '../commander';
import COMMANDS from '../commands';
import { ClientErrorEvent, NamespaceProxySentinel, NamespaceProxySentinelClient, ProxySentinel, ProxySentinelClient, RedisNode, RedisSentinelClientType, RedisSentinelEvent, RedisSentinelOptions, RedisSentinelType, SentinelCommander } from './types';
import { clientSocketToNode, createNodeList, parseNode } from './utils';
import { RedisMultiQueuedCommand } from '../multi-command';
import RedisSentinelMultiCommand, { RedisSentinelMultiCommandType } from './multi-commands';
import { PubSubListener } from '../client/pub-sub';
import { PubSubProxy } from './pub-sub-proxy';
import WaitQueue from 'wait-queue';
import { setTimeout } from 'node:timers/promises';

// to transpile typescript to js - npm run build -- ./packages/client
// js files will be in the 'dist' folder
// 

/* TODO:
   3) move sentinel commands implemented with javascript interfaces to be a pseudo module in the code
   4) support command optionsu(type mapping, abort signals)
   5) `testWithSentinel`
*/

type execType = "WATCH" | "UNWATCH" | "EXEC";

type clientType = "MASTER" | "REPLICA";

interface clientInfo {
  type: clientType;
  id: number;
  watchEpoch?: number;
}

export class RedisSentinelClient<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends EventEmitter {
  #clientInfo?: clientInfo;
  #internal: RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>;
  readonly self: RedisSentinelClient<M, F, S, RESP, TYPE_MAPPING>;

  static extractWatchUnwatch(redisArgs: Array<RedisArgument>): execType | undefined {
    if (redisArgs[0] === "WATCH" || redisArgs[0] === "UNWATCH") {
      return redisArgs[0];
    } else {
      return undefined
    }
  }

  get isOpen() {
    return this.self.#internal.isOpen;
  }

  get isReady() {
    return this.self.#internal.isReady;
  }

  #commandOptions?: CommandOptions<TYPE_MAPPING>;

  constructor(
    internal: RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>,
    clientInfo: clientInfo,
    commandOptions?: CommandOptions<TYPE_MAPPING>
  ) {
    super();
    this.self = this;

    this.#internal = internal;
    //    this.#internal.on('error', err => this.emit('error', err));

    this.#clientInfo = clientInfo;

    this.#commandOptions = commandOptions;
  }

  private static _createCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: ProxySentinelClient, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        execType = RedisSentinelClient.extractWatchUnwatch(redisArgs),
        reply = await this.sendCommand(
          execType,
          command.IS_READ_ONLY,
          redisArgs,
          this.self.#commandOptions
        );

      return transformReply ?
        transformReply(reply, redisArgs.preserve) :
        reply;
    };
  }

  private static _createModuleCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: NamespaceProxySentinelClient, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        reply = await this.self.sendCommand(
          undefined,
          command.IS_READ_ONLY,
          redisArgs,
          this.self.self.#commandOptions
        );

      return transformReply ?
        transformReply(reply, redisArgs.preserve) :
        reply;
    };
  }

  private static _createFunctionCommand(name: string, fn: RedisFunction, resp: RespVersions) {
    const prefix = functionArgumentsPrefix(name, fn),
      transformReply = getTransformReply(fn, resp);
    return async function (this: NamespaceProxySentinelClient, ...args: Array<unknown>) {
      const fnArgs = fn.transformArguments(...args),
        redisArgs = prefix.concat(fnArgs),
        reply = await this.self.sendCommand(
          undefined,
          fn.IS_READ_ONLY,
          redisArgs,
          this.self.self.#commandOptions
        );

      return transformReply ?
        transformReply(reply, fnArgs.preserve) :
        reply;
    };
  }

  private static _createScriptCommand(script: RedisScript, resp: RespVersions) {
    const prefix = scriptArgumentsPrefix(script),
      transformReply = getTransformReply(script, resp);
    return async function (this: ProxySentinelClient, ...args: Array<unknown>) {
      const scriptArgs = script.transformArguments(...args),
        redisArgs = prefix.concat(scriptArgs),
        reply = await this.executeScript(
          script,
          script.IS_READ_ONLY,
          redisArgs,
          this.self.#commandOptions
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
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
  >(config?: SentinelCommander<M, F, S, RESP, TYPE_MAPPING>) {
    const SentinelClient = attachConfig({
      BaseClass: RedisSentinelClient,
      commands: COMMANDS,
      createCommand: RedisSentinelClient._createCommand,
      createModuleCommand: RedisSentinelClient._createModuleCommand,
      createFunctionCommand: RedisSentinelClient._createFunctionCommand,
      createScriptCommand: RedisSentinelClient._createScriptCommand,
      config
    });

    SentinelClient.prototype.Multi = RedisSentinelMultiCommand.extend(config);

    return (
      internal: RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>,
      clientInfo: clientInfo,
      commandOptions?: CommandOptions<TYPE_MAPPING>
    ) => {
      // returning a "proxy" to prevent the namespaces.self to leak between "proxies"
      return Object.create(new SentinelClient(internal, clientInfo, commandOptions)) as RedisSentinelClientType<M, F, S, RESP, TYPE_MAPPING>;
    };
  }

  static create<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
  >(
    internal: RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>,
    clientInfo: clientInfo,
    commandOptions?: CommandOptions<TYPE_MAPPING>,
    options?: RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>
  ) {
    return RedisSentinelClient.factory(options)(internal, clientInfo, commandOptions);
  }

  withCommandOptions<
    OPTIONS extends CommandOptions<TYPE_MAPPING>,
    TYPE_MAPPING extends TypeMapping,
  >(options: OPTIONS) {
    const proxy = Object.create(this);
    proxy._commandOptions = options;
    return proxy as RedisSentinelClientType<
      M,
      F,
      S,
      RESP,
      TYPE_MAPPING extends TypeMapping ? TYPE_MAPPING : {}
    >;
  }

  private _commandOptionsProxy<
    K extends keyof CommandOptions,
    V extends CommandOptions[K]
  >(
    key: K,
    value: V
  ) {
    const proxy = Object.create(this);
    proxy._commandOptions = Object.create(this.self.#commandOptions ?? null);
    proxy._commandOptions[key] = value;
    return proxy as RedisSentinelClientType<
      M,
      F,
      S,
      RESP,
      K extends 'typeMapping' ? V extends TypeMapping ? V : {} : TYPE_MAPPING
    >;
  }

  /**
   * Override the `typeMapping` command option
   */
  withTypeMapping<TYPE_MAPPING extends TypeMapping>(typeMapping: TYPE_MAPPING) {
    return this._commandOptionsProxy('typeMapping', typeMapping);
  }

  async _execute<T>(
    execType: execType | undefined,
    isReadonly: boolean | undefined,
    fn: (client: RedisClient<M, F, S, RESP, TYPE_MAPPING>) => Promise<T>
  ): Promise<T> {
    if (this.self.#clientInfo === undefined) {
      throw new Error("Attempted execution on released RedisSentinelClient lease");
    }

    return await this.self.#internal.execute(fn, this.self.#clientInfo, execType);
  }

  async sendCommand<T = ReplyUnion>(
    execType: execType | undefined,
    isReadonly: boolean | undefined,
    args: CommandArguments,
    options?: CommandOptions,
  ): Promise<T> {
    return this._execute(
      execType,
      isReadonly,
      client => client.sendCommand(args, options)
    );
  }

  executeScript(
    script: RedisScript,
    isReadonly: boolean | undefined,
    args: Array<RedisArgument>,
    options?: CommandOptions
  ) {
    return this._execute(
      undefined,
      isReadonly,
      client => client.executeScript(script, args, options)
    );
  }

  /**
   * @internal
   */
  async _executePipeline(
    isReadonly: boolean | undefined,
    commands: Array<RedisMultiQueuedCommand>
  ) {
    return this._execute(
      undefined,
      isReadonly,
      client => client._executePipeline(commands)
    );
  }

  /**f
    * @internal
    */
  async _executeMulti(
    isReadonly: boolean | undefined,
    commands: Array<RedisMultiQueuedCommand>
  ) {
    return this._execute(
      "EXEC",
      isReadonly,
      client => client._executeMulti(commands)
    );
  }

  MULTI(): RedisSentinelMultiCommandType<[], M, F, S, RESP, TYPE_MAPPING> {
    return new (this as any).Multi(this);
  }

  multi = this.MULTI;


  release() {
    if (this.self.#clientInfo === undefined) {
      throw new Error('RedisSentinelClient lease alredy released');
    }

    this.self.#internal.releaseClientLease(this.self.#clientInfo);
    this.self.#clientInfo = undefined;
  }
}

export default class RedisSentinel<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends EventEmitter {
  readonly self: RedisSentinel<M, F, S, RESP, TYPE_MAPPING>;

  #internal: RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>;
  #options: RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>;

  get isOpen() {
    return this.self.#internal.isOpen;
  }

  get isReady() {
    return this.self.#internal.isReady;
  }

  #commandOptions?: CommandOptions<TYPE_MAPPING>;

  #trace: (msg: string) => unknown = () => { };

  constructor(options: RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>) {
    super();

    this.self = this;

    this.#options = options;

    if (options?.commandOptions) {
      this.#commandOptions = options.commandOptions;
    }

    this.#internal = new RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>(options);
    this.#internal.on('error', err => this.emit('error', err));

    /* pass through underling events */
    /* TODO: perhaps make this a struct and one vent, instead of multiple events */
    this.#internal.on('topology-change', (event: RedisSentinelEvent) => {
      if (!this.emit('topology-change', event)) {
        this.self.#trace(`RedisSentinel: re-emit for topology-change for ${event.type} event returned false`);
      }
    });
  }

  private static _createCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: ProxySentinel, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        execType = RedisSentinelClient.extractWatchUnwatch(redisArgs),
        reply = await this.sendCommand(
          execType,
          command.IS_READ_ONLY,
          redisArgs,
          this.self.#commandOptions
        );

      return transformReply ?
        transformReply(reply, redisArgs.preserve) :
        reply;
    };
  }

  private static _createModuleCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: NamespaceProxySentinel, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        reply = await this.self.sendCommand(
          undefined,
          command.IS_READ_ONLY,
          redisArgs,
          this.self.self.#commandOptions
        );

      return transformReply ?
        transformReply(reply, redisArgs.preserve) :
        reply;
    };
  }

  private static _createFunctionCommand(name: string, fn: RedisFunction, resp: RespVersions) {
    const prefix = functionArgumentsPrefix(name, fn),
      transformReply = getTransformReply(fn, resp);
    return async function (this: NamespaceProxySentinel, ...args: Array<unknown>) {
      const fnArgs = fn.transformArguments(...args),
        redisArgs = prefix.concat(fnArgs),
        reply = await this.self.sendCommand(
          undefined,
          fn.IS_READ_ONLY,
          redisArgs,
          this.self.self.#commandOptions
        );

      return transformReply ?
        transformReply(reply, fnArgs.preserve) :
        reply;
    };
  }

  private static _createScriptCommand(script: RedisScript, resp: RespVersions) {
    const prefix = scriptArgumentsPrefix(script),
      transformReply = getTransformReply(script, resp);
    return async function (this: ProxySentinel, ...args: Array<unknown>) {
      const scriptArgs = script.transformArguments(...args),
        redisArgs = prefix.concat(scriptArgs),
        reply = await this.executeScript(
          script,
          script.IS_READ_ONLY,
          redisArgs,
          this.self.#commandOptions
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
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
  >(config?: SentinelCommander<M, F, S, RESP, TYPE_MAPPING>) {
    const Sentinel = attachConfig({
      BaseClass: RedisSentinel,
      commands: COMMANDS,
      createCommand: RedisSentinel._createCommand,
      createModuleCommand: RedisSentinel._createModuleCommand,
      createFunctionCommand: RedisSentinel._createFunctionCommand,
      createScriptCommand: RedisSentinel._createScriptCommand,
      config
    });

    Sentinel.prototype.Multi = RedisSentinelMultiCommand.extend(config);

    return (options?: Omit<RedisSentinelOptions, keyof Exclude<typeof config, undefined>>) => {
      // returning a "proxy" to prevent the namespaces.self to leak between "proxies"
      return Object.create(new Sentinel(options)) as RedisSentinelType<M, F, S, RESP, TYPE_MAPPING>;
    };
  }

  static create<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
  >(options?: RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>) {
    return RedisSentinel.factory(options)(options);
  }

  withCommandOptions<
    OPTIONS extends CommandOptions<TYPE_MAPPING>,
    TYPE_MAPPING extends TypeMapping,
  >(options: OPTIONS) {
    const proxy = Object.create(this);
    proxy._commandOptions = options;
    return proxy as RedisSentinelType<
      M,
      F,
      S,
      RESP,
      TYPE_MAPPING extends TypeMapping ? TYPE_MAPPING : {}
    >;
  }

  private _commandOptionsProxy<
    K extends keyof CommandOptions,
    V extends CommandOptions[K]
  >(
    key: K,
    value: V
  ) {
    const proxy = Object.create(this.self);
    proxy._commandOptions = Object.create(this.self.#commandOptions ?? null);
    proxy._commandOptions[key] = value;
    return proxy as RedisSentinelType<
      M,
      F,
      S,
      RESP,
      K extends 'typeMapping' ? V extends TypeMapping ? V : {} : TYPE_MAPPING
    >;
  }

  /**
   * Override the `typeMapping` command option
   */
  withTypeMapping<TYPE_MAPPING extends TypeMapping>(typeMapping: TYPE_MAPPING) {
    return this._commandOptionsProxy('typeMapping', typeMapping);
  }

  connect() {
    return this.self.#internal.connect();
  }

  async _execute<T>(
    execType: execType | undefined,
    isReadonly: boolean | undefined,
    fn: (client: RedisClient<M, F, S, RESP, TYPE_MAPPING>) => Promise<T>
  ): Promise<T> {
    let clientInfo: clientInfo | undefined;
    if (!isReadonly || !this.self.#options.useReplicas) {
      clientInfo = await this.self.#internal.getClientLease('MASTER');
    }

    try {
      return await this.self.#internal.execute(fn, clientInfo, execType);
    } finally {
      if (clientInfo !== undefined) {
        this.self.#internal.releaseClientLease(clientInfo);
      }
    }
  }

  async use<T>(fn: (sentinelClient: RedisSentinelClientType<M, F, S, RESP, TYPE_MAPPING>) => Promise<T>) {
    const clientInfo = await this.self.#internal.getClientLease('MASTER');
    const sentinelClient = RedisSentinelClient.create(this.self.#internal, clientInfo, this.self.#commandOptions, this.self.#options);

    try {
      return await fn(sentinelClient);
    } finally {
      this.self.#internal.releaseClientLease(clientInfo);
    }
  }

  async sendCommand<T = ReplyUnion>(
    execType: execType | undefined,
    isReadonly: boolean | undefined,
    args: CommandArguments,
    options?: CommandOptions,
  ): Promise<T> {
    return this._execute(
      execType,
      isReadonly,
      client => client.sendCommand(args, options)
    );
  }

  executeScript(
    script: RedisScript,
    isReadonly: boolean | undefined,
    args: Array<RedisArgument>,
    options?: CommandOptions
  ) {
    return this._execute(
      undefined,
      isReadonly,
      client => client.executeScript(script, args, options)
    );
  }

  /**
   * @internal
   */
  async _executePipeline(
    isReadonly: boolean | undefined,
    commands: Array<RedisMultiQueuedCommand>
  ) {
    return this._execute(
      undefined,
      isReadonly,
      client => client._executePipeline(commands)
    );
  }

  /**f
    * @internal
    */
  async _executeMulti(
    isReadonly: boolean | undefined,
    commands: Array<RedisMultiQueuedCommand>
  ) {
    return this._execute(
      "EXEC",
      isReadonly,
      client => client._executeMulti(commands)
    );
  }

  MULTI(): RedisSentinelMultiCommandType<[], M, F, S, RESP, TYPE_MAPPING> {
    return new (this as any).Multi(this);
  }

  multi = this.MULTI;

  async close() {
    return this.self.#internal.close();
  }

  destroy() {
    return this.self.#internal.destroy();
  }

  async SUBSCRIBE<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.self.#internal.subscribe(channels, listener, bufferMode);
  }

  subscribe = this.SUBSCRIBE;

  async UNSUBSCRIBE<T extends boolean = false>(
    channels?: string | Array<string>,
    listener?: PubSubListener<boolean>,
    bufferMode?: T
  ) {
    return this.self.#internal.unsubscribe(channels, listener, bufferMode);
  }

  unsubscribe = this.UNSUBSCRIBE;

  async PSUBSCRIBE<T extends boolean = false>(
    patterns: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.self.#internal.pSubscribe(patterns, listener, bufferMode);
  }

  pSubscribe = this.PSUBSCRIBE;

  async PUNSUBSCRIBE<T extends boolean = false>(
    patterns?: string | Array<string>,
    listener?: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.self.#internal.pUnsubscribe(patterns, listener, bufferMode);
  }

  pUnsubscribe = this.PUNSUBSCRIBE;

  async aquire(): Promise<RedisSentinelClientType<M, F, S, RESP, TYPE_MAPPING>> {
    const clientInfo = await this.self.#internal.getClientLease('MASTER');
    return RedisSentinelClient.create(this.self.#internal, clientInfo, this.self.#commandOptions, this.self.#options);
  }

  setDebug(val: boolean) {
    this.self.#internal.debug = val;
  }

  getSentinelNode(): RedisNode | undefined {
    return this.self.#internal.getSentinelNode();
  }

  getMasterNode(): RedisNode | undefined {
    return this.self.#internal.getMasterNode();
  }

  getReplicaNodes(): Map<RedisNode, number> {
    return this.self.#internal.getReplicaNodes();
  }

  setTracer(tracer?: Array<string>) {
    if (tracer) {
      this.self.#trace = (msg: string) => { tracer.push(msg) };
    } else {
      this.self.#trace = () => { };
    }

    this.self.#internal.setTracer(tracer);
  }
}

class RedisSentinelInternal<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends EventEmitter {
  #isOpen = false;

  get isOpen() {
    return this.#isOpen;
  }

  #isReady = false;

  get isReady() {
    return this.#isReady;
  }

  readonly #name: string;
  readonly #nodeClientOptions: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>;
  readonly #sentinelClientOptions: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>;
  readonly #useReplicas: boolean;
  readonly #scanInterval: number;
  readonly #passthroughClientErrorEvents: boolean;

  debug: boolean;
  #anotherReset = false;

  #configEpoch: number = 0;

  #sentinelRootNodes: Array<RedisNode>;
  #sentinelClient?: RedisClientType<M, F, S, RESP, TYPE_MAPPING>;

  #masterClients: Array<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> = [];
  #masterClientQueue: WaitQueue<number>;
  readonly #masterPoolSize: number;

  #replicaClients: Array<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> = [];
  #replicaClientsIdx: number = 0;
  readonly #replicaPoolSize: number;

  #connectPromise?: Promise<void>;
  #maxCommandRediscovers: number;
  #pubSubProxy: PubSubProxy<M, F, S, RESP, TYPE_MAPPING>;

  #scanTimer?: NodeJS.Timeout

  #destroy = false;

  #trace: (msg: string) => unknown = () => { };

  constructor(options: RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>) {
    super();

    this.#name = options.name;
    this.#useReplicas = options.useReplicas ?? false;
    this.debug = options.debug ?? false;
    this.#scanInterval = options.scanInterval ?? 0;
    this.#passthroughClientErrorEvents = options.passthroughClientErrorEvents ?? false;

    this.#sentinelRootNodes = Array.from(options.sentinelRootNodes);
    this.#maxCommandRediscovers = options.maxCommandRediscovers ?? 16;
    this.#masterPoolSize = options.masterPoolSize ?? 1;
    this.#replicaPoolSize = options.replicaPoolSize ?? 1;

    this.#nodeClientOptions = options.nodeClientOptions ? Object.assign({} as RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>, options.nodeClientOptions) : {};
    if (this.#nodeClientOptions.url !== undefined) {
      throw new Error("invalid nodeClientOptions for Sentinel");
    }

    this.#sentinelClientOptions = options.sentinelClientOptions ? Object.assign({} as RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>, options.sentinelClientOptions) : {};
    if (this.#sentinelClientOptions.url !== undefined) {
      throw new Error("invalid sentinelClientOptions for Sentinel");
    }

    this.#masterClientQueue = new WaitQueue<number>();
    for (let i = 0; i < this.#masterPoolSize; i++) {
      this.#masterClientQueue.push(i);
    }

    /* persistent object for life of sentinel object */
    this.#pubSubProxy = new PubSubProxy(this.#nodeClientOptions)
      .on('error', err => this.emit('error', err))
      .on('client-error', event => this.emit('client-error', event));
  }

  #debugLog(msg: string) {
    if (this.debug) {
      console.log(msg);
    }
  }

  #createClient(node: RedisNode, clientOptions: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>, reconnectStrategy?: undefined | false): RedisClientType<M, F, S, RESP, TYPE_MAPPING> {
    const options = { ...clientOptions } as RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>;

    if (clientOptions.socket) {
      options.socket = { ...clientOptions.socket };
    } else {
      options.socket = {};
    }

    options.socket.host = node.host;
    options.socket.port = node.port;
    options.socket.reconnectStrategy = reconnectStrategy;

    return RedisClient.create(options);
  }

  async getClientLease(type: 'MASTER') {
    const clientInfo: clientInfo = {
      type: type,
      id: -1,
    }

    switch (type) {
      case 'MASTER':
        clientInfo.id = await this.#masterClientQueue.shift();
        break;
    }

    return clientInfo;
  }

  releaseClientLease(clientInfo: clientInfo) {
    switch (clientInfo.type) {
      case 'MASTER':
        const client = this.#masterClients[clientInfo.id];
        // client can be undefined if releasing in middle of a reconfigure
        if (client !== undefined && client.isReady && clientInfo.watchEpoch !== undefined) {
          client.unwatch();
        }
        this.#masterClientQueue.push(clientInfo.id);
        break;
    }
  }

  async connect() {
    if (this.#isOpen) {
      throw new Error("already attempting to open")
    }

    try {
      this.#isOpen = true;

      this.#connectPromise = this.#connect()
      await this.#connectPromise;
      this.#isReady = true;
    } finally {
      this.#connectPromise = undefined
      if (this.#scanInterval > 0) {
        this.#scanTimer = setInterval(this.#reset.bind(this), this.#scanInterval);
      }
    }
  }

  async #connect() {
    while (true) {
      this.#debugLog("starting connect loop");
      if (this.#destroy) {
        this.#debugLog("in #connect and want to destroy")
        return;
      }
      try {
        this.#anotherReset = false;
        await this.transform(this.analyze(await this.observe()));
        if (this.#anotherReset) {
          this.#trace("#connect: anotherReset is true, so continuing");
          continue;
        }

        this.#trace("#connect: returning");
        return;
      } catch (e: any) {
        this.#trace(`#connect: exception ${e.message}`);
        if (e.message !== 'no valid master node') {
          console.log(e);
        }
        await setTimeout(1000);
      } finally {
        this.#debugLog("finished connect");
      }
    }
  }

  async execute<T>(
    fn: (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>) => Promise<T>,
    clientInfo?: clientInfo,
    execType?: execType,
  ): Promise<T> {
    let iter = 0;

    const watchEpoch = clientInfo?.watchEpoch;

    while (true) {
      if (this.#connectPromise !== undefined) {
        await this.#connectPromise;
      }

      if (execType === "WATCH") {
        if (clientInfo === undefined) {
          throw new Error("WATCH only works on a client with a lease");
        } else if (clientInfo.watchEpoch === undefined) {
          clientInfo.watchEpoch = this.#configEpoch;
        }
      } else if (execType === "UNWATCH") {
        if (clientInfo === undefined) {
          throw new Error("UNWATCH only works on a client with a lease");
        } else {
          clientInfo.watchEpoch = undefined;
        }
      } if (execType === "EXEC") {
        /* need to unset on exec, if success or not */
        if (clientInfo !== undefined) {
          clientInfo.watchEpoch = undefined;
        }
        if (watchEpoch !== undefined && watchEpoch !== this.#configEpoch) {
          throw new Error("sentinel config changed in middle of a WATCH Transaction");
        }
      }

      const client = this.#getClient(clientInfo);

      if (!client.isReady) {
        await this.#reset();
        continue;
      }
      this.#debugLog("attemping to send command to " + client.options?.socket?.host + ":" + client.options?.socket?.port)

      try {
        /*
                // force testing of READONLY errors        
                if (clientInfo !== undefined) {
                  if (Math.floor(Math.random() * 10) < 1) {
                    console.log("throwing READONLY error");
                    throw new Error("READONLY You can't write against a read only replica.");
                  }
                }
        */
        return await fn(client);
      } catch (err) {
        if (++iter > this.#maxCommandRediscovers || !(err instanceof Error)) {
          throw err;
        }

        /* 
          rediscover and retry if doing a command against a "master"
          a) READONLY error (topology has changed) but we haven't been notified yet via pubsub
          b) client is "not ready" (disconnected), which means topology might have changed, but sentinel might not see it yet
        */
        if (clientInfo?.type == 'MASTER' &&
          (err.message.startsWith('READONLY') || !client.isReady)
        ) {
          await this.#reset();
          continue;
        }

        throw err;
      }
    }
  }

  async #createPubSub(client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>) {
    /* Whenever sentinels or slaves get added, or when slave configuration changes, reconfigure */
    client.pSubscribe(['switch-master', '[-+]sdown', '+slave', '+sentinel', '[-+]odown', '+slave-reconf-done'], (message, channel) => {
      this.#debugLog("pubsub control channel message on " + channel);
      this.#doPubSubReset();
    }, true);

    return client;
  }

  async #doPubSubReset() {
    this.#reset()
  }

  #getClient(clientInfo?: clientInfo): RedisClientType<M, F, S, RESP, TYPE_MAPPING> {
    if (clientInfo !== undefined) {
      return this.#masterClients[clientInfo.id];
    }

    if (this.#replicaClientsIdx >= this.#replicaClients.length) {
      this.#replicaClientsIdx = 0;
    }

    if (this.#replicaClients.length == 0) {
      throw new Error("no replicas available for read");
    }

    return this.#replicaClients[this.#replicaClientsIdx++];
  }

  async #reset() {
    /* closing / don't reset */
    if (this.#isReady == false || this.#destroy == true) {
      return;
    }

    // already in #connect()
    if (this.#connectPromise !== undefined) {
      this.#anotherReset = true;
      this.#debugLog("connectPromise already defined, waiting on it");
      return await this.#connectPromise;
    }

    try {
      this.#connectPromise = this.#connect();
      return await this.#connectPromise;
    } finally {
      this.#debugLog("finished reconfgure");
      this.#connectPromise = undefined;
    }
  }

  async close() {
    this.#destroy = true;

    if (this.#connectPromise != undefined) {
      await this.#connectPromise;
    }

    this.#isReady = false;

    if (this.#scanTimer) {
      clearInterval(this.#scanTimer);
      this.#scanTimer = undefined;
    }

    const promises = [];

    if (this.#sentinelClient !== undefined) {
      if (this.#sentinelClient.isOpen) {
        promises.push(this.#sentinelClient.close());
      }
      this.#sentinelClient = undefined;
    }

    for (const client of this.#masterClients) {
      if (client.isOpen) {
        promises.push(client.close());
      }
    }

    this.#masterClients = [];

    for (const client of this.#replicaClients) {
      if (client.isOpen) {
        promises.push(client.close());
      }
    }

    this.#replicaClients = [];

    promises.push(this.#pubSubProxy.close());

    await Promise.all(promises);

    this.#pubSubProxy = new PubSubProxy(this.#nodeClientOptions).on('error', err => this.emit('error', err));

    this.#isOpen = false;
  }

  // destroy has to be async because its stopping others async events, timers and the like
  // and shouldn't return until its finished.
  async destroy() {
    this.#destroy = true;

    if (this.#connectPromise != undefined) {
      await this.#connectPromise;
    }

    this.#isReady = false;

    if (this.#scanTimer) {
      clearInterval(this.#scanTimer);
      this.#scanTimer = undefined;
    }

    if (this.#sentinelClient !== undefined) {
      if (this.#sentinelClient.isOpen) {
        this.#sentinelClient.destroy();
      }
      this.#sentinelClient = undefined;
    }

    for (const client of this.#masterClients) {
      if (client.isOpen) {
        client.destroy();
      }
    }
    this.#masterClients = [];

    for (const client of this.#replicaClients) {
      if (client.isOpen) {
        client.destroy();
      }
    }
    this.#replicaClients = []

    this.#pubSubProxy.destroy();
    this.#pubSubProxy = new PubSubProxy(this.#nodeClientOptions).on('error', err => this.emit('error', err));

    this.#isOpen = false
    this.#destroy = false;
  }

  async subscribe<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.#pubSubProxy.subscribe(channels, listener, bufferMode);
  }

  async unsubscribe<T extends boolean = false>(
    channels?: string | Array<string>,
    listener?: PubSubListener<boolean>,
    bufferMode?: T
  ) {
    return this.#pubSubProxy.unsubscribe(channels, listener, bufferMode);
  }

  async pSubscribe<T extends boolean = false>(
    patterns: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.#pubSubProxy.pSubscribe(patterns, listener, bufferMode);
  }

  async pUnsubscribe<T extends boolean = false>(
    patterns?: string | Array<string>,
    listener?: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.#pubSubProxy.pUnsubscribe(patterns, listener, bufferMode);
  }

  async observe() {
    for (const node of this.#sentinelRootNodes) {
      let client: RedisClientType<M, F, S, RESP, TYPE_MAPPING> | undefined;
      try {
        this.#trace(`observe: trying to connect to sentinel: ${node.host}:${node.port}`)
        client = this.#createClient(node, this.#sentinelClientOptions, false)
          .on('error', (err) => this.emit('error', `obseve client error: ${err}`));
        await client.connect();
        this.#trace(`observe: connected to sentinel`)

        const promises = [];
        promises.push(client.sentinelSentinels(this.#name));
        promises.push(client.sentinelMaster(this.#name));
        promises.push(client.sentinelReplicas(this.#name));

        const [sd, md, rd] = await Promise.all(promises);

        this.#trace("observe: got all sentinel data");

        const sentinelData = sd as Array<any>;
        const masterData = md as any;
        const replicaData = rd as Array<any>;

        const ret = {
          sentinelConnected: node,
          sentinelData: sentinelData,
          masterData: masterData,
          replicaData: replicaData,
          currentMaster: this.getMasterNode(),
          currentReplicas: this.getReplicaNodes(),
          currentSentinel: this.getSentinelNode(),
          replicaPoolSize: this.#replicaPoolSize,
          useReplicas: this.#useReplicas
        }

        if (this.debug) {
          this.printObserved(ret);
        }
        return ret;
      } catch (err) {
        this.#trace(`observe: error ${err}`);
        this.emit('error', err);
      } finally {
        if (client !== undefined && client.isOpen) {
          this.#trace(`observe: destroying sentinel client`);
          client.destroy();
        }
      }
    }

    this.#trace(`observe: none of the sentinels are available`);
    throw new Error('None of the sentinels are avftracailable');
  }

  analyze(observed: Awaited<ReturnType<RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>["observe"]>>) {
    let master = parseNode(observed.masterData);
    if (master === undefined) {
      this.#trace(`analyze: no valid master node because ${observed.masterData.flags}`);
      throw new Error("no valid master node");
    }

    if (master.host === observed.currentMaster?.host && master.port === observed.currentMaster?.port) {
      this.#trace(`analyze: master node hasn't changed from ${observed.currentMaster?.host}:${observed.currentMaster?.port}`);
      master = undefined;
    } else {
      this.#trace(`analyze: master node has changed to ${master.host}:${master.port} from ${observed.currentMaster?.host}:${observed.currentMaster?.port}`);
    }

    let sentinel: RedisNode | undefined = observed.sentinelConnected;
    if (sentinel.host === observed.currentSentinel?.host && sentinel.port === observed.currentSentinel.port) {
      this.#trace(`analyze: sentinel node hasn't changed`);
      sentinel = undefined;
    } else {
      this.#trace(`analyze: sentinel node has changed to ${sentinel.host}:${sentinel.port}`);
    }

    const replicasToClose: Array<RedisNode> = [];
    const replicasToOpen = new Map<RedisNode, number>();

    const desiredSet = new Set<string>();
    const seen = new Set<string>();

    if (observed.useReplicas) {
      const replicaList = createNodeList(observed.replicaData)

      for (const node of replicaList) {
        desiredSet.add(JSON.stringify(node));
      }

      for (const [node, value] of observed.currentReplicas) {
        if (!desiredSet.has(JSON.stringify(node))) {
          replicasToClose.push(node);
          this.#trace(`analyze: adding ${node.host}:${node.port} to replicsToClose`);
        } else {
          seen.add(JSON.stringify(node));
          if (value != observed.replicaPoolSize) {
            replicasToOpen.set(node, observed.replicaPoolSize - value);
            this.#trace(`analyze: adding ${node.host}:${node.port} to replicsToOpen`);
          }
        }
      }

      for (const node of replicaList) {
        if (!seen.has(JSON.stringify(node))) {
          replicasToOpen.set(node, observed.replicaPoolSize);
          this.#trace(`analyze: adding ${node.host}:${node.port} to replicsToOpen`);
        }
      }
    }

    const ret = {
      sentinelList: [observed.sentinelConnected].concat(createNodeList(observed.sentinelData)),
      epoch: Number(observed.masterData['config-epoch']),

      sentinelToOpen: sentinel,
      masterToOpen: master,
      replicasToClose: replicasToClose,
      replicasToOpen: replicasToOpen,
    };

    if (this.debug) {
      this.printAnalyzed(ret);
    }

    return ret;
  }

  async transform(analyzed: ReturnType<RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>["analyze"]>) {
    this.#trace("transfrm: enter");
    try {
      let promises: Array<Promise<any>> = [];

      if (analyzed.sentinelToOpen) {
        this.#trace(`transform: opening a new sentinel`);
        if (this.#sentinelClient !== undefined && this.#sentinelClient.isOpen) {
          this.#trace(`transform: destroying old sentinel as open`);
          this.#sentinelClient.destroy()
          this.#sentinelClient = undefined;
        } else {
          this.#trace(`transform: not destroying old sentinel as not open`);
        }

        this.#trace(`transform: creating new sentinel to ${analyzed.sentinelToOpen.host}:${analyzed.sentinelToOpen.port}`);
        const node = analyzed.sentinelToOpen;
        const client = this.#createClient(analyzed.sentinelToOpen, this.#sentinelClientOptions, false);
        client.on('error', (err: Error) => {
          if (this.#passthroughClientErrorEvents) {
            this.emit('error', new Error(`Sentinel Client (${node.host}:${node.port}): ${err.message}`, { cause: err }));
          }
          const event: ClientErrorEvent = {
            type: 'SENTINEL',
            node: clientSocketToNode(client.options!.socket!),
            error: err
          };
          this.emit('client-error', event);
          this.#reset();
        });
        this.#sentinelClient = client;

        this.#trace(`transform: adding sentinel client connect() to promise list`);
        const promise = this.#sentinelClient.connect().then((client) => { return this.#createPubSub(client) });
        promises.push(promise);

        this.#debugLog(`created sentinel client to ${analyzed.sentinelToOpen.host}:${analyzed.sentinelToOpen.port}`);
        const event: RedisSentinelEvent = {
          type: "SENTINEL_CHANGE",
          node: analyzed.sentinelToOpen
        }
        this.#trace(`transform: emiting topology-change event for sentinel_change`);
        if (!this.emit('topology-change', event)) {
          this.#trace(`transform: emit for topology-change for sentinel_change returned false`);
        }
      }

      if (analyzed.masterToOpen) {
        this.#trace(`transform: opening a new master`);
        const masterPromises = []

        this.#trace(`transform: destroying old masters if open`);
        for (const client of this.#masterClients) {
          if (client.isOpen) {
            client.destroy()
          }
        }
        this.#masterClients = [];

        this.#trace(`transform: creating all master clients and adding connect promises`);
        for (let i = 0; i < this.#masterPoolSize; i++) {
          const node = analyzed.masterToOpen;
          const client = this.#createClient(analyzed.masterToOpen, this.#nodeClientOptions);
          client.on('error', (err: Error) => {
            if (this.#passthroughClientErrorEvents) {
              this.emit('error', new Error(`Master Client (${node.host}:${node.port}): ${err.message}`, { cause: err }));
            }
            const event: ClientErrorEvent = {
              type: "MASTER",
              node: clientSocketToNode(client.options!.socket!),
              error: err
            };
            this.emit('client-error', event);
          });

          this.#masterClients.push(client);
          masterPromises.push(client.connect());

          this.#debugLog(`created master client to ${analyzed.masterToOpen.host}:${analyzed.masterToOpen.port}`);
        }

        this.#trace(`transform: adding promise to change #pubSubProxy node`);
        masterPromises.push(this.#pubSubProxy.changeNode(analyzed.masterToOpen));
        promises.push(...masterPromises);
        const event: RedisSentinelEvent = {
          type: "MASTER_CHANGE",
          node: analyzed.masterToOpen
        }
        this.#trace(`transform: emiting topology-change event for master_change`);
        if (!this.emit('topology-change', event)) {
          this.#trace(`transform: emit for topology-change for master_change returned false`);
        }
        this.#configEpoch++;
      }

      const replicaCloseSet = new Set<string>();
      for (const node of analyzed.replicasToClose) {
        const str = JSON.stringify(node);
        replicaCloseSet.add(str);
      }

      const newClientList: Array<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> = [];
      const removedSet = new Set<string>();

      for (const replica of this.#replicaClients) {
        const node = clientSocketToNode(replica.options!.socket!);
        const str = JSON.stringify(node);

        if (replicaCloseSet.has(str) || !replica.isOpen) {
          if (replica.isOpen) {
            this.#debugLog(`destroying replica client to ${replica.options?.socket?.host}:${replica.options?.socket?.port}`);
            replica.destroy()
          }
          if (!removedSet.has(str)) {
            const event: RedisSentinelEvent = {
              type: "REPLICA_REMOVE",
              node: node
            }
            this.emit('topology-change', event);
            removedSet.add(str);
          }
        } else {
          newClientList.push(replica);
        }
      }
      this.#replicaClients = newClientList;

      if (analyzed.replicasToOpen.size != 0) {
        for (const [node, size] of analyzed.replicasToOpen) {
          for (let i = 0; i < size; i++) {
            const client = this.#createClient(node, this.#nodeClientOptions);
            client.on('error', (err: Error) => {
              if (this.#passthroughClientErrorEvents) {
                this.emit('error', new Error(`Replica Client (${node.host}:${node.port}): ${err.message}`, { cause: err }));
              }
              const event: ClientErrorEvent = {
                type: "REPLICA",
                node: clientSocketToNode(client.options!.socket!),
                error: err
              };
              this.emit('client-error', event);
            });

            this.#replicaClients.push(client);
            promises.push(client.connect());

            this.#debugLog(`created replica client to ${node.host}:${node.port}`);
          }
          const event: RedisSentinelEvent = {
            type: "REPLICA_ADD",
            node: node
          }
          this.emit('topology-change', event);
        }
      }

      if (analyzed.sentinelList.length != this.#sentinelRootNodes.length) {
        this.#sentinelRootNodes = analyzed.sentinelList;
        const event: RedisSentinelEvent = {
          type: "SENTINE_LIST_CHANGE",
          size: analyzed.sentinelList.length
        }
        this.emit('topology-change', event);
      }

      await Promise.all(promises);
    } catch (err) {
      this.#trace(`transform: caught exception ${err}`);
      throw err;
    }
  }

  getMasterNode(): RedisNode | undefined {
    if (this.#masterClients.length == 0) {
      return undefined;
    }

    for (const master of this.#masterClients) {
      if (master.isReady) {
        return clientSocketToNode(master.options!.socket!);
      }
    }

    return undefined;
  }

  getSentinelNode(): RedisNode | undefined {
    if (this.#sentinelClient === undefined) {
      return undefined;
    }

    return clientSocketToNode(this.#sentinelClient.options!.socket!);
  }

  getReplicaNodes(): Map<RedisNode, number> {
    const ret = new Map<RedisNode, number>();
    const initialMap = new Map<string, number>();

    for (const replica of this.#replicaClients) {
      const node = clientSocketToNode(replica.options!.socket!);
      const hash = JSON.stringify(node);

      if (replica.isReady) {
        initialMap.set(hash, (initialMap.get(hash) ?? 0) + 1);
      } else {
        if (!initialMap.has(hash)) {
          initialMap.set(hash, 0);
        }
      }
    }

    for (const [key, value] of initialMap) {
      ret.set(JSON.parse(key) as RedisNode, value);
    }

    return ret;
  }

  setTracer(tracer?: Array<string>) {
    if (tracer) {
      this.#trace = (msg: string) => { tracer.push(msg) };
    } else {
      this.#trace = () => { };
    }
  }

  printObserved(observed: Awaited<ReturnType<RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>["observe"]>>) {
    console.log("observed:");
    console.log(`current master: ${JSON.stringify(observed.currentMaster)}`);
    console.log(`current replicas: ${JSON.stringify([...observed.currentReplicas.entries()])}`);
    console.log(`current sentinel: ${JSON.stringify(observed.currentSentinel)}`);
    console.log(`master data: ${JSON.stringify(observed.masterData)}`);
    console.log(`replica data: ${JSON.stringify(observed.replicaData)}`);
    console.log(`repilica pool size: ${observed.replicaPoolSize}`);
    console.log(`sentinel connected: ${JSON.stringify(observed.sentinelConnected)}`);
    console.log(`sentinel data: ${JSON.stringify(observed.sentinelData)}`);
  }

  printAnalyzed(analyzed: ReturnType<RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>["analyze"]>) {
    console.log("analyzed:");
    console.log(`masterToOpen: ${JSON.stringify(analyzed.masterToOpen)}`);
    console.log(`replicasToClose: ${JSON.stringify(analyzed.replicasToClose)}`);
    console.log(`replicasToOpen: ${JSON.stringify([...analyzed.replicasToOpen.entries()])}`)
    console.log(`sentinelList: ${JSON.stringify(analyzed.sentinelList)}`);
    console.log(`sentinelToOpen: ${JSON.stringify(analyzed.replicasToOpen)}`);
  }
}

export class RedisSentinelFactory extends EventEmitter {
  options: RedisSentinelOptions;
  #sentinelRootNodes: Array<RedisNode>;
  #replicaIdx: number = -1;

  constructor(options: RedisSentinelOptions) {
    super();

    this.options = options;
    this.#sentinelRootNodes = options.sentinelRootNodes;
  }

  async updateSentinelRootNodes() {
    for (const node of this.#sentinelRootNodes) {
      const options: RedisClientOptions = { ...this.options.sentinelClientOptions };
      if (options.socket === undefined) {
        options.socket = {};
      }
      options.socket.host = node.host;
      options.socket.port = node.port;
      options.socket.reconnectStrategy = false;

      const client = RedisClient.create(options).on('error', (err) => this.emit(`updateSentinelRootNodes: ${err}`));
      try {
        await client.connect();
      } catch {
        if (client.isOpen) {
          client.destroy();
        }
        continue;
      }

      try {
        const sentinelData = await client.sentinelSentinels(this.options.name) as Array<any>;
        this.#sentinelRootNodes = [node].concat(createNodeList(sentinelData));
        return;
      } finally {
        client.destroy();
      }
    }

    throw new Error("Couldn't connect to any sentinel node");
  }

  async getMasterNode() {
    let connected = false;

    for (const node of this.#sentinelRootNodes) {
      const options: RedisClientOptions = { ...this.options.sentinelClientOptions };
      if (options.socket === undefined) {
        options.socket = {};
      }
      options.socket.host = node.host;
      options.socket.port = node.port;
      options.socket.reconnectStrategy = false;

      const client = RedisClient.create(options).on('error', err => this.emit(`getMasterNode: ${err}`));

      try {
        await client.connect();
      } catch {
        if (client.isOpen) {
          client.destroy();
        }
        continue;
      }

      connected = true;

      try {
        const masterData = await client.sentinelMaster(this.options.name) as any;

        let master = parseNode(masterData);
        if (master === undefined) {
          continue;
        }

        return master;
      } finally {
        client.destroy();
      }
    }

    if (connected) {
      throw new Error("Master Node Not Enumerated");
    }

    throw new Error("couldn't connect to any sentinels");
  }

  async getMasterClient() {
    const master = await this.getMasterNode();
    const options: RedisClientOptions = { ...this.options.nodeClientOptions };
    if (options.socket === undefined) {
      options.socket = {};
    }
    options.socket.host = master.host;
    options.socket.port = master.port;

    return RedisClient.create(options);;
  }

  async getReplicaNodes() {
    let connected = false;

    for (const node of this.#sentinelRootNodes) {
      const options: RedisClientOptions = { ...this.options.sentinelClientOptions };
      if (options.socket === undefined) {
        options.socket = {};
      }
      options.socket.host = node.host;
      options.socket.port = node.port;
      options.socket.reconnectStrategy = false;

      const client = RedisClient.create(options).on('error', err => this.emit(`getReplicaNodes: ${err}`));

      try {
        await client.connect();
      } catch {
        if (client.isOpen) {
          client.destroy();
        }
        continue;
      }

      connected = true;

      try {
        const replicaData = await client.sentinelReplicas(this.options.name) as Array<any>;

        const replicas = createNodeList(replicaData);
        if (replicas.length == 0) {
          continue;
        }

        return replicas;
      } finally {
        client.destroy();
      }
    }

    if (connected) {
      throw new Error("No Replicas Nodes Enumerated");
    }

    throw new Error("couldn't connect to any sentinels");
  }

  async getReplicaClient() {
    const replicas = await this.getReplicaNodes();
    if (replicas.length == 0) {
      throw new Error("no available replicas");
    }

    this.#replicaIdx++;
    if (this.#replicaIdx >= replicas.length) {
      this.#replicaIdx = 0;
    }

    const options: RedisClientOptions = { ...this.options.nodeClientOptions };
    if (options.socket === undefined) {
      options.socket = {};
    }
    options.socket.host = replicas[this.#replicaIdx].host;
    options.socket.port = replicas[this.#replicaIdx].port;

    return RedisClient.create(options);
  }
}