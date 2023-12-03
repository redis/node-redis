import { EventEmitter } from 'node:events';
import { Command, CommandArguments, RedisArgument, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts, ReplyUnion, RespVersions, TypeMapping } from '../RESP/types';
import RedisClient, { RedisClientOptions, RedisClientType } from '../client';
import { CommandOptions } from '../client/commands-queue';
import { attachConfig, functionArgumentsPrefix, getTransformReply, scriptArgumentsPrefix } from '../commander';
import COMMANDS from '../commands';
import { NamespaceProxySentinel, ProxySentinel, RedisNode, RedisSentinelOptions, RedisSentinelType, SentinelCommander } from './types';
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

//var sentinel = new RedisSentinel({name: "redis-primary", sentinelRootNodes: [{"host": "127.0.0.1", "port": 26380}]})
//await sentinel.connect()
//sentinel.sendCommand(false, ["set", "x",  "1"])
//sentinel.sendCommand(true, ["get", "x"])

/* TODO:
   1) support config fot master/replica clients (not socket)
   2) support for commands/scripts/functions attached to sentinel object
   3) see if any sentinel commands should be given direct javascript interfaces
   4) support command optionsu(type mapping, abort signals)
   5) `testWithSentinel`

   1) remove command policies
   2) pubsub
   3) investigate pool

   sentinel = create(pool_size=3)
*/

type execType = "WATCH" | "UNWATCH" | "EXEC";

type clientType = "MASTER" | "REPLICA";

interface clientInfo {
  type: clientType;
  id: number;
  watchEpoch?: number;
}

export default class RedisSentinel<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends EventEmitter {
  clientInfo?: clientInfo;

  internal: RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>;
  options: RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>;

  static extractWatchUnwatchExec(redisArgs: Array<RedisArgument>): execType | undefined {
    if (redisArgs[0] === "WATCH" || redisArgs[0] === "UNWATCH") {
      return redisArgs[0];
    } else {
      return undefined
    }
  }

  get isOpen() {
    return this.internal.isOpen;
  }

  get isReady() {
    return this.internal.isReady;
  }

  _commandOptions?: CommandOptions<TYPE_MAPPING>;

  constructor(options: RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>) {
    super();

    this.options = options;

    if (options?.commandOptions) {
      this._commandOptions = options.commandOptions;
    }

    this.internal = new RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>(options);
    this.internal.on('error', err => this.emit('error', err));

    /* pass through underling events */
    this.internal.on('sentinel-change', node => {
      this.emit('sentinel-change', node);
    }).on('master-change', node => {
      this.emit('master-change', node);
    }).on('replica-removed', node => {
      this.emit('replica-removed', node);
    }).on('replica-added', node => {
      this.emit('replica-added', node);
    }).on('sentinels-modified', (size) => {
      this.emit('sentinels-modified', size);
    });
  }

  /* used to setup RedisSentinel objects with leases */
  #setClientInfo(clientInfo?: clientInfo) {
    this.clientInfo = clientInfo;
  }

  /* used to setup RedisSentinel objects with leases */
  #setInternalObject(internal: RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>) {
    this.internal = internal;
  }

  private static _createCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: ProxySentinel, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        execType = RedisSentinel.extractWatchUnwatchExec(redisArgs),
        reply = await this.sendCommand(
          execType,
          command.IS_READ_ONLY,
          redisArgs,
          this._commandOptions
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
          this.self._commandOptions
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
          this.self._commandOptions
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
        reply = await this.sendCommand(
          undefined,
          script.IS_READ_ONLY,
          redisArgs,
          this._commandOptions
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

  duplicate<
    _M extends RedisModules = M,
    _F extends RedisFunctions = F,
    _S extends RedisScripts = S,
    _RESP extends RespVersions = RESP,
    _TYPE_MAPPING extends TypeMapping = TYPE_MAPPING
  >(overrides?: Partial<RedisSentinelOptions<_M, _F, _S, _RESP, _TYPE_MAPPING>>) {
    return new (Object.getPrototypeOf(this).constructor)({
      ...this.options,
      commandOptions: this._commandOptions,
      ...overrides
    }) as RedisSentinelType<_M, _F, _S, _RESP, _TYPE_MAPPING>;
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
    const proxy = Object.create(this);
    proxy._commandOptions = Object.create(this._commandOptions ?? null);
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

  async connect() {
    return await this.internal.connect();
  }

  async _execute<T>(
    execType: execType | undefined,
    isReadonly: boolean | undefined,
    fn: (client: RedisClient<M, F, S, RESP, TYPE_MAPPING>) => Promise<T>
  ): Promise<T> {
    let clientInfo = this.clientInfo;

    if (clientInfo == undefined) {
      if (!isReadonly || !this.options.useReplicas) {
        clientInfo = await this.internal.getClientLease('MASTER');
      }
    }

    try {
      return await this.internal.execute(fn, clientInfo, execType);
    } finally {
      if (clientInfo !== undefined && this.clientInfo == undefined) {
        this.internal.releaseClientLease(clientInfo);
      }
    }
  }

  async use<T>(fn: (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>) => Promise<T>) {
    const clientInfo = await this.internal.getClientLease('MASTER');

    try {
      return await this.internal.execute(fn, clientInfo, undefined);
    } finally {
      this.internal.releaseClientLease(clientInfo);
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
    /* calling close() on a leased version */
    if (this.clientInfo !== undefined) {
      return this.release();
    }

    return this.internal.close();
  }

  destroy() {
    /* calling destroy() on a leased version */
    if (this.clientInfo !== undefined) {
      return this.release();
    }

    return this.internal.destroy();
  }

  async SUBSCRIBE<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.internal.subscribe(channels, listener, bufferMode);
  }

  subscribe = this.SUBSCRIBE;

  async UNSUBSCRIBE<T extends boolean = false>(
    channels?: string | Array<string>,
    listener?: PubSubListener<boolean>,
    bufferMode?: T
  ) {
    return this.internal.unsubscribe(channels, listener, bufferMode);
  }

  unsubscribe = this.UNSUBSCRIBE;

  async PSUBSCRIBE<T extends boolean = false>(
    patterns: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.internal.pSubscribe(patterns, listener, bufferMode);
  }

  pSubscribe = this.PSUBSCRIBE;

  async PUNSUBSCRIBE<T extends boolean = false>(
    patterns?: string | Array<string>,
    listener?: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.internal.pUnsubscribe(patterns, listener, bufferMode);
  }

  pUnsubscribe = this.PUNSUBSCRIBE;

  async getMasterClientLease(): Promise<RedisSentinelType<M, F, S, RESP, TYPE_MAPPING>> {
    const newSentinel = this.duplicate();
    newSentinel.#setInternalObject(this.internal);
    newSentinel.#setClientInfo(await this.internal.getClientLease('MASTER'));

    return newSentinel;
  }

  release() {
    if (this.clientInfo) {
      this.internal.releaseClientLease(this.clientInfo);
      this.clientInfo = undefined;
    }
  }

  setDebug(val: boolean) {
    this.internal.debug = val;
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

  debug: boolean;

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

  constructor(options: RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>) {
    super();

    this.#name = options.name;
    this.#useReplicas = options.useReplicas ?? false;
    this.debug = options.debug ?? false;
    this.#scanInterval = options.scanInterval ?? 0;

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
    this.#pubSubProxy = new PubSubProxy(this.#nodeClientOptions).on('error', err => this.emit('error', err));
  }

  #debugLog(msg: string) {
    if (this.debug) {
      console.log(msg);
    }
  }

  #createClient(node: RedisNode, clientOptions: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>): RedisClientType<M, F, S, RESP, TYPE_MAPPING> {
    const options = { ...clientOptions } as RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>;

    if (clientOptions.socket) {
      options.socket = { ...clientOptions.socket };
    } else {
      options.socket = {};
    }

    options.socket.host = node.host;
    options.socket.port = node.port;
    options.socket.reconnectStrategy = false;

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
        if (client.isReady && clientInfo.watchEpoch !== undefined) {
          client.unwatch();
        }
        this.#masterClientQueue.push(clientInfo.id);
        break;
    }
  }

  async connect() {
    if (!this.#isOpen && this.#connectPromise !== undefined) {
      throw new Error("already attempting to open")
    }

    try {
      this.#isOpen = true;

      this.#connectPromise = this.#connect()
      await this.#connectPromise;
    } finally {
      this.#connectPromise = undefined
      if (this.#destroy) {
        this.#debugLog("in connect and want to destroy");
        this.destroy();
      } else {
        if (this.#scanInterval > 0) {
          this.#scanTimer = setInterval(this.#reset.bind(this), this.#scanInterval);
        }
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
        const ret = await this.transform(this.analyze(await this.observe()));
        if (ret) {
          continue;
        }

        this.#isReady = true;

        return;
      } catch (e: any) {
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
      if (!this.isReady) {
        if (!(await this.waitReady())) {
          throw new Error("sentinel didn't get ready to be used")
        }
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

  async #createPubSub() {
    /* Whenever sentinels or slaves get added, or when slave configuration changes, reconfigure */
    this.#sentinelClient!.pSubscribe(['switch-master', '[-+]sdown', '+slave', '+sentinel', '[-+]odown'], (message, channel) => {
      this.#debugLog("pubsub control channel message on " + channel);
      this.#doPubSubReset();
    }, true);
  }

  async #doPubSubReset() {
    await this.#reset()
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
    if (this.#isReady == false) {
      return;
    }

    /* already in a reset/connection loop */
    if (this.#connectPromise !== undefined) {
      this.#debugLog("connectPromise already defined, waiting on it");
      return await this.#connectPromise;
    }

    try {
      this.#connectPromise = this.#connect();
      return await this.#connectPromise;
    } finally {
      this.#debugLog("finished the reset!");
      this.#connectPromise = undefined;
      if (this.#destroy) {
        this.#debugLog("in #reset and want to destroy");
        this.destroy();
      }
    }
  }

  async close() {
    if (this.#connectPromise != undefined) {
      this.#destroy = true;
      return;
    }

    this.#isReady = false;

    if (this.#scanTimer) {
      clearInterval(this.#scanTimer);
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

    this.#pubSubProxy = new PubSubProxy(this.#nodeClientOptions).on("error", err => this.emit('error', err));

    this.#isOpen = false;
  }

  destroy() {
    if (this.#connectPromise != undefined) {
      this.#destroy = true;
      return;
    }

    this.#isReady = false;

    if (this.#scanTimer) {
      clearInterval(this.#scanTimer);
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
    if (this.#pubSubProxy === undefined) {
      console.log("#pubSubProxy is undefined");
    }
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

  async waitReady(): Promise<boolean> {
    for (let i = 0; i < this.#maxCommandRediscovers && this.#isOpen && !this.#isReady; i++) {
      await setTimeout(1000);
    }

    return this.isReady;
  }

  async observe() {
    for (const node of this.#sentinelRootNodes) {
      let client: RedisClientType<M, F, S, RESP, TYPE_MAPPING> | undefined;
      try {
        client = this.#createClient(node, this.#sentinelClientOptions)
          .on('uncaughtException', err => this.emit('error', err))
          .on('error', (err) => this.emit('error', err));
        await client.connect();

        const sentinelData = await client.sentinelSentinels(this.#name) as Array<any>;
        const masterData = await client.sentinelMaster(this.#name) as any;
        const replicaData = await client.sentinelReplicas(this.#name) as Array<any>;

        const ret = {
          sentinelConnected: node,
          sentinelData: sentinelData,
          masterData: masterData,
          replicaData: replicaData,
          currentMaster: this.#getMasterNode(),
          currentReplicas: this.#getReplicaNodes(),
          currentSentinel: this.#getSentinelNode(),
          replicaPoolSize: this.#replicaPoolSize,
          useReplicas: this.#useReplicas
        }

        if (this.debug) {
          this.printObserved(ret);
        }
        return ret;
      } catch (err) {
        this.emit('error', err);
      } finally {
        if (client !== undefined && client.isOpen) {
          client.destroy();
        }
      }
    }

    throw new Error('None of the sentinels are available');
  }

  analyze(observed: Awaited<ReturnType<RedisSentinelInternal<M, F, S, RESP, TYPE_MAPPING>["observe"]>>) {
    let master = parseNode(observed.masterData);
    if (master === undefined) {
      throw new Error("no valid master node");
    }

    if (master.host === observed.currentMaster?.host && master.port === observed.currentMaster?.port) {
      master = undefined;
    }

    let sentinel: RedisNode | undefined = observed.sentinelConnected;
    if (sentinel.host === observed.currentSentinel?.host && sentinel.port === observed.currentSentinel.port) {
      sentinel = undefined;
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
        } else {
          seen.add(JSON.stringify(node));
          if (value != observed.replicaPoolSize) {
            replicasToOpen.set(node, observed.replicaPoolSize - value);
          }
        }
      }

      for (const node of replicaList) {
        if (!seen.has(JSON.stringify(node))) {
          replicasToOpen.set(node, observed.replicaPoolSize);
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
    let changes = false;
    if (analyzed.sentinelToOpen) {
      changes = true;
      if (this.#sentinelClient !== undefined && this.#sentinelClient.isOpen) {
        this.#sentinelClient.destroy()
        this.#sentinelClient = undefined;
      }

      this.#sentinelClient = this.#createClient(analyzed.sentinelToOpen, this.#sentinelClientOptions)
        .on('uncaughtException', err => this.emit('error', err))
        .on('error', err => {
          this.emit('error', err)
          this.#reset();
        });

      await this.#sentinelClient.connect();

      this.#debugLog(`created sentinel client to ${analyzed.sentinelToOpen.host}:${analyzed.sentinelToOpen.port}`);

      await this.#createPubSub();
      this.emit('sentinel-change', analyzed.sentinelToOpen);
    }

    if (analyzed.masterToOpen) {
      changes = true;
      for (const client of this.#masterClients) {
        if (client.isOpen) {
          client.destroy()
        }
      }
      this.#masterClients = [];

      for (let i = 0; i < this.#masterPoolSize; i++) {
        const client = this.#createClient(analyzed.masterToOpen, this.#nodeClientOptions)
          .on('uncaughtException', err => this.emit('error', err))
          .on('error', err => this.emit('error', err));

        this.#masterClients.push(client);
        await client.connect();


        this.#debugLog(`created master client to ${analyzed.masterToOpen.host}:${analyzed.masterToOpen.port}`);
      }

      await this.#pubSubProxy.changeNode(analyzed.masterToOpen);
      this.emit('master-change', analyzed.masterToOpen);
      this.#configEpoch++;

    }

    if (analyzed.replicasToClose.length != 0) {
      const newClientList: Array<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> = [];

      changes = true;
      const replicaCloseSet = new Set<string>();
      for (const node of analyzed.replicasToClose) {
        const str = JSON.stringify(node);
        replicaCloseSet.add(str);
      }

      for (const replica of this.#replicaClients) {
        const node = clientSocketToNode(replica.options!.socket!);
        const str = JSON.stringify(node);
        if (replicaCloseSet.has(str)) {
          if (replica.isOpen) {
            replica.destroy()
          }
          this.emit('replica-removed', node);
        } else {
          if (replica.isReady) {
            newClientList.push(replica);
          }
        }
      }
      this.#replicaClients = newClientList;
    }

    if (analyzed.replicasToOpen.size != 0) {
      changes = true;
      for (const [node, size] of analyzed.replicasToOpen) {
        for (let i = 0; i < size; i++) {
          const client = this.#createClient(node, this.#nodeClientOptions)
            .on('uncaughtException', err => this.emit('error', err))
            .on('error', err => this.emit('error', err));

          this.#replicaClients.push(client);
          await client.connect();

          this.#debugLog(`created replica client to ${node.host}:${node.port}`);
        }
        this.emit('replica-added', node);
      }
    }

    if (analyzed.sentinelList.length != this.#sentinelRootNodes.length) {
      this.#sentinelRootNodes = analyzed.sentinelList;
      this.emit('sentinels-modified', analyzed.sentinelList.length);
    }

    return changes;
  }

  #getMasterNode(): RedisNode | undefined {
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

  #getSentinelNode(): RedisNode | undefined {
    if (this.#sentinelClient === undefined) {
      return undefined;
    }

    return clientSocketToNode(this.#sentinelClient.options!.socket!);
  }

  #getReplicaNodes(): Map<RedisNode, number> {
    const ret = new Map<RedisNode, number>();
    const initialMap = new Map<string, number>();

    for (const replica of this.#replicaClients) {
      if (replica.isReady) {
        const node = clientSocketToNode(replica.options!.socket!);

        const hash = JSON.stringify(node);

        initialMap.set(hash, (initialMap.get(hash) ?? 0) + 1);
      }
    }

    for (const [key, value] of initialMap) {
      ret.set(JSON.parse(key) as RedisNode, value);
    }

    return ret;
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