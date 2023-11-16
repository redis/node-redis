import { EventEmitter } from 'node:events';
import { Command, CommandArguments, RedisArgument, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts, ReplyUnion, RespVersions, TypeMapping } from '../RESP/types';
import RedisClient, { RedisClientOptions, RedisClientType } from '../client';
import { CommandOptions } from '../client/commands-queue';
import { attachConfig, functionArgumentsPrefix, getTransformReply, scriptArgumentsPrefix } from '../commander';
import COMMANDS from '../commands';
import { NamespaceProxySentinel, ProxySentinel, RedisNode, RedisSentinelOptions, RedisSentinelType, SentinelCommander } from './types';
import { createNodeList, parseNode } from './utils';
import { RedisMultiQueuedCommand } from '../multi-command';
import RedisSentinelMultiCommand, { RedisSentinelMultiCommandType } from './multi-commands';
import { PubSubListener, PubSubTypeListeners } from '../client/pub-sub';
import { PubSubProxy } from './pub-sub-proxy';
import WaitQueue from 'wait-queue';

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

  tmpClientInfo?: clientInfo;
  tmpClientInfoPromise?: Promise<clientInfo>;
  tmpClientInfoCount: number = 0;

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
    this.internal.on('error', err => {
      // TODO: channel name
      this.emit('error', err);
    })
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

  async getClientLease(isReadOnly?: boolean): Promise<clientInfo> {
    switch (isReadOnly) {
      case undefined:
      case false: {
        return this.internal.getClientLease('MASTER');
      }
      case true: {
        if (this.options.useReplicas) {
          return this.internal.getClientLease('REPLICA');
        } else {
          return this.internal.getClientLease('MASTER');
        }
      }
    }
  }

  async _execute<T>(
    execType: execType | undefined,
    isReadonly: boolean | undefined,
    fn: (client: RedisClient<M, F, S, RESP, TYPE_MAPPING>) => Promise<T>
  ): Promise<T> {

    var clientInfo = this.clientInfo;

    if (clientInfo === undefined) { 
      if (this.tmpClientInfo === undefined) {
        if (this.tmpClientInfoPromise === undefined) {
          this.tmpClientInfoPromise = this.getClientLease(isReadonly);
        }
        this.tmpClientInfo = await this.tmpClientInfoPromise;
        this.tmpClientInfoPromise = undefined;
      }
      clientInfo = this.tmpClientInfo;
      this.tmpClientInfoCount++;
    }

    try {
      return await this.internal.execute(clientInfo, fn, execType, isReadonly);
    } finally {
      if (this.tmpClientInfo !== undefined) {
        if (--this.tmpClientInfoCount == 0) {
          this.internal.releasClientLease(this.tmpClientInfo);
          this.tmpClientInfo = undefined;
        }
      }
    }
  }

  async use<T>(
    fn: (client: RedisClient<M, F, S, RESP, TYPE_MAPPING>) => Promise<T>,
    isReadOnly: boolean | undefined
  ) {
    const clientInfo = await this.getClientLease(isReadOnly);

    try {
      return await this.internal.execute(clientInfo, fn, undefined, undefined);
    } finally {
      this.internal.releasClientLease(clientInfo);
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
    return this.internal.close();
  }

  destroy() {
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

  async getReplicaClientLease(): Promise<RedisSentinelType<M, F, S, RESP, TYPE_MAPPING>> {
    const newSentinel = this.duplicate();
    newSentinel.#setInternalObject(this.internal);
    newSentinel.#setClientInfo(await this.internal.getClientLease('REPLICA'));

    return newSentinel;
  }

  release() {
    if (this.clientInfo) {
      this.internal.releasClientLease(this.clientInfo);
      this.clientInfo = undefined;
    }
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

  #configEpoch: number = -1;

  #sentinelRootNodes: Array<RedisNode>;
  #sentinelClient?: RedisClientType<M, F, S, RESP, TYPE_MAPPING>;
  #pubsubClient?: RedisClientType<M, F, S, RESP, TYPE_MAPPING>;
  
  #masterClients: Array<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> = [];
  #masterClientQueue: WaitQueue<number>;
  readonly #masterPoolSize: number;

  #replicaClients: Array<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> = [];
  #replicaClientQueue: WaitQueue<number>;
  readonly #replicaPoolSize: number;

  #connectPromise?: Promise<void>;
  #sentinelResetPromise?: Promise<void>;
  #maxCommandRediscovers: number;
  #pubSubProxy: PubSubProxy<M, F, S, RESP, TYPE_MAPPING>;

  constructor(options: RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>) {
    super();

    this.#name = options.name;
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
    this.#replicaClientQueue = new WaitQueue<number>();

    /* persistent object for life of sentinel object */
    this.#pubSubProxy = new PubSubProxy(this.#nodeClientOptions);
  }

  #createClient(node: RedisNode, clientOptions: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>): RedisClientType<M, F, S, RESP, TYPE_MAPPING> {
    const options = { ...clientOptions} as RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>;

    if (clientOptions.socket) {
      options.socket = { ...clientOptions.socket };
    } else {
      options.socket = {};
    }

    options.socket.host = node.host;
    options.socket.port = node.port;
    
    return RedisClient.create(options);
  }

  async getClientLease(type: clientType) {
    const clientInfo: clientInfo = {
      type: type,
      id: -1,
    }

    switch (type) {
      case 'MASTER':
        clientInfo.id = await this.#masterClientQueue.shift();
        break;
      case 'REPLICA':
        clientInfo.id = await this.#replicaClientQueue.shift();
        break;
    }

    return clientInfo;
  }

  releasClientLease(clientInfo: clientInfo) {
    console.log("calling release");

    switch (clientInfo.type) {
      case 'MASTER':
        this.#masterClientQueue.push(clientInfo.id);
        break;
      case 'REPLICA':
        this.#replicaClientQueue.push(clientInfo.id);
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
    }
  }

  async #connect(channelsListeners?: PubSubTypeListeners, patternsListeners?: PubSubTypeListeners) {
    while (true) {
      try {
        const { client, epoch } = await this.#getSentinelAndEpoch();
        const node: RedisNode = {host: client.options!.socket!.host!, port: client.options!.socket!.port!}
        this.#sentinelClient = client;
        this.#configEpoch = epoch

        await this.#updateSentinelNodes(node);
        const { master, replicas } = await this.#getDBNodes();

        const masterNode = parseNode(master);
        if (masterNode === undefined) {
          throw new Error("got an undefined master node");
        }
        console.log("master host = " + masterNode?.host + " port = " + masterNode?.port);

        for(var i=0; i < this.#masterPoolSize; i++) {
          const client = await this.#createClient(masterNode, this.#nodeClientOptions)
            .on('error', err => {
              // TODO: channel name 
              console.log("emitting master client error");
              this.emit('error', err);
            })
            .on('uncaughtException', (err) => { console.log("uncaught - " + err) })
            .connect();

          this.#masterClients.push(client);
          this.#masterClientQueue.push(i);

          console.log("created master client to " + masterNode?.host + ":" + masterNode?.port);
        }

        await this.#pubSubProxy.changeNode(masterNode);

        /* can work, even if cannot connect to replica nodes */
        const replicaNodeList = createNodeList(replicas)

        var count = 0;
        for (var i=0; i < this.#replicaPoolSize; i++) {
          for (let replicaNode of replicaNodeList) {
            if (replicaNode.port === 0) {
              continue;
            }

            console.log("replica host = " + replicaNode.host + " port = " + replicaNode.port);
            try {
              const client = await this.#createClient(replicaNode, this.#nodeClientOptions)
                .on('error', err => {
                  console.log("emitting replica client error");
                  //  TODO: channel name
                  this.emit('error', err);
                })
                .on('uncaughtException', (err) => { console.log("uncaught - " + err) })
                .connect();
              this.#replicaClients.push(client)
              this.#replicaClientQueue.push(++count);
              console.log("created replica client to " + replicaNode.host + ":" + replicaNode.port);
            } catch (e) {
              console.log("failed to create replica client to " + replicaNode?.host + ":" + replicaNode?.port);
              console.log(e);
            }
          }
        }

        await this.#createPubSub()

        this.#isReady = true;

        return
      } catch (e) {
        console.log(e);
        this.#destroy();
        continue;
      }
    }
  }

  async execute<T>(
    clientInfo: clientInfo,
    fn: (client: RedisClient<M, F, S, RESP, TYPE_MAPPING>) => Promise<T>,
    execType: execType | undefined,
    isReadonly: boolean | undefined
  ): Promise<T> {
    if (!(await this.#waitReady())) {
      throw new Error("sentinel didn't get ready to be used")
    }

    if (execType !== undefined) {
      if (execType === "WATCH" && clientInfo.watchEpoch === undefined) {
        clientInfo.watchEpoch = this.#configEpoch;
      } else if (execType === "UNWATCH") {
        clientInfo.watchEpoch = undefined;
      } else if (execType === "EXEC") {
        /* need to unset on exec, if success or not */
        const watchEpoch = clientInfo.watchEpoch;
        clientInfo.watchEpoch = undefined;
        if (watchEpoch !== undefined && watchEpoch !== this.#configEpoch) {
          throw new Error("sentinel config changed in middle of a WATCH Transaction");
        }
      }
    }

    let iter = 0;
    while (true) {
      let client = this.#getClient(clientInfo);
      console.log("attemping to send command to " + client.options?.socket?.host + ":" + client.options?.socket?.port)

      try {
        return await fn(client);
      } catch (err) {
        console.log("Hello: caught exception");
        if (++iter > this.#maxCommandRediscovers || !(err instanceof Error)) {
          console.log("Hello: rethrowing error");
          throw err;
        }

        if (err.message.startsWith('READONLY') && clientInfo.type == 'MASTER') {
          await this.#reset()
          continue;
        }

        console.log("Hello: unknwon case: " + err.message);
        throw err;
      } 
    }
  }

  async #updateSentinelNodes(node: RedisNode) {
    const sentinelData = await this.#sentinelClient?.sentinelSentinels(this.#name) as Array<any>;

    const sentinelList = createNodeList(sentinelData);

    const list = [node];
    this.#sentinelRootNodes = list.concat(sentinelList);
  }
  
  async #getDBNodes() {
    const [masterReply, replicaReply] = await Promise.all([
      this.#sentinelClient?.sentinelMaster(this.#name),
      this.#sentinelClient?.sentinelReplicas(this.#name),
    ]);

    const master = masterReply as any;
    const replicas = replicaReply as Array<any>;

    return {
      master,
      replicas
    };
  }
  
  async #createPubSub() {
    if (this.#pubsubClient !== undefined) {
      if (this.#pubsubClient.isOpen) {
        if (this.#pubsubClient.isReady) {
          await this.#pubsubClient.pUnsubscribe();
        }
        this.#pubsubClient.destroy();
      }
      this.#pubsubClient = undefined
    }
  
    this.#pubsubClient = await this.#sentinelClient?.duplicate()
      .on('error', (err: any) => {
        console.log("emitting pubsub client error");
        // TODO: channel name
        this.emit('error', err);
        if (this.#sentinelResetPromise !== undefined) {
          if (this.#sentinelResetPromise !== undefined) {
            this.#sentinelResetPromise = this.#sentinelReset()
          }
        }
      })
      .on('uncaughtException', (err: any) => { console.log("uncaught - " + err) })
      .connect();
  
    /* Whenever sentinels or slaves get added, or when slave configuration changes, reconfigure */
    this.#pubsubClient?.pSubscribe(['switch-master', '[-+]sdown', '+slave', '+sentinel'], (message, channel) => {
      console.log("pubsub channel message on " + channel);
      switch (channel.toString()) {
        case '+sentinel':
          this.#sentinelReset();
        default:
          this.#doPubSubReset();
      }
    }, true);
  }
  
  async #doPubSubReset() {
    console.log("HELLO PUBSUB RESET")
    await this.#reset()
  }
  
  async #getSentinelAndEpoch() {
    for (const node of this.#sentinelRootNodes) {
      try { 
        const client = this.#createClient(node, this.#sentinelClientOptions)
          .on('uncaughtException', (err) => { console.log("uncaught - " + err) })
        await client.connect();
  
        client.on('error', err => {
          console.log("emitting sentinel client error");
          // TODO: channel name
          this.emit('error', err);
          this.#sentinelReset();
        })
  
        const data = await client.sentinelMaster(this.#name) as any;

        /* TODO: better to use map interface */
        const epoch = Number(data['config-epoch']);

        return { client, epoch };
      } catch (err) {
        console.log("emitting exception error in getSentinelAndEpoch");
        // TODO: channel name
        this.emit('error', err);
      }
    }

    throw new Error('None of the sentinels are available');
  }
  
  async #sentinelReset() {
    if (this.#sentinelResetPromise !== undefined) {
      await this.#sentinelResetPromise
      return;
    }

    if (this.#sentinelClient !== undefined && this.#sentinelClient.isOpen && this.#pubsubClient !== undefined && this.#pubsubClient.isOpen) {
      console.log("no need to reset sentinel")
      return
    }

    if (this.#pubsubClient !== undefined) {
      if (this.#pubsubClient.isOpen) {
        this.#pubsubClient.destroy()
      }
      this.#pubsubClient = undefined
    }

    if (this.#sentinelClient !== undefined) {
      if (this.#sentinelClient.isOpen) {
        this.#sentinelClient.destroy()
      }
      this.#sentinelClient = undefined;
    }

    const { client, epoch } = await this.#getSentinelAndEpoch();
    console.log("sentinel dropped, got a new one")
  
    if (epoch === this.#configEpoch) {
      console.log("config epoch hasn't changed, just setting up new sentinel")
      this.#sentinelClient = client;
      /* FIXME: possible to fail */
      await this.#createPubSub()
      return;
    }

    console.log("config epoch has changed, resetting")
    client.destroy()

    await this.#reset()
  }

  #getClient(clientInfo: clientInfo): RedisClientType<M, F, S, RESP, TYPE_MAPPING> {
    switch (clientInfo.type) {
      case 'MASTER':
        return this.#masterClients[clientInfo.id];
      case 'REPLICA':
        return this.#replicaClients[clientInfo.id];
    }
  }

  async #reset() {
    if (this.#connectPromise !== undefined) {
      return await this.#connectPromise;
    }

    this.#destroy();

    try {
      this.#connectPromise = this.#connect();
      return await this.#connectPromise;
    } finally {
      console.log("finished the reset!");
      this.#connectPromise = undefined;
    }
  }

  async #close() {
    this.#isReady = false;

    const promises = [];

    if (this.#sentinelClient !== undefined) {
      if (this.#sentinelClient.isOpen) {
        promises.push(this.#sentinelClient.close());
      }
      this.#sentinelClient = undefined;
    }

    if (this.#pubsubClient !== undefined) {
      if (this.#pubsubClient.isOpen) {
        promises.push(this.#pubsubClient.close());
      }
      this.#pubsubClient = undefined;
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
  }

  async close() {
    if (!this.#isReady) {
      return;
    }

    await this.#close()
    
    this.#isOpen = false;
  }

  async #destroy() {
    this.#isReady = false;

    if (this.#pubsubClient !== undefined) {
      if (this.#pubsubClient.isOpen) {
        if (this.#pubsubClient.isReady) {
          await this.#pubsubClient.pUnsubscribe();
        }
        this.#pubsubClient.destroy();
      }
      this.#pubsubClient = undefined;
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

    /* doesn't set to undefined, as will reuse object */
    this.#pubSubProxy.destroy();
  }

  async destroy() {
    if (!this.#isReady) {
      return
    }

    await this.#destroy()

    this.#isOpen = false
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

  async #waitReady(): Promise<boolean> {
    for (let i = 0; i < this.#maxCommandRediscovers && !this.#isReady; i++) {
      await new Promise(r => setTimeout(r, 1000));
    }

    return this.isReady;
  }
}