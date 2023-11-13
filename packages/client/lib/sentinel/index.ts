import { EventEmitter } from 'node:events';
import { Command, CommandArguments, RedisArgument, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts, ReplyUnion, RespVersions, TypeMapping } from '../RESP/types';
import RedisClient, { RedisClientOptions, RedisClientType } from '../client';
import { CommandOptions } from '../client/commands-queue';
import { attachConfig, functionArgumentsPrefix, getTransformReply, scriptArgumentsPrefix } from '../commander';
import COMMANDS from '../commands';
import { ClientClosedError } from '../errors';
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
*/

type execType = "WATCH" | "UNWATCH" | "EXEC";

export default class RedisSentinel<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends EventEmitter {
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
    return this.internal.execute(execType, isReadonly, fn);
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
  
  /**
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

  async getMasterClient(): Promise<RedisClient<M, F, S, RESP, TYPE_MAPPING>> {
    return this.internal.getMasterClient();
  }

  async getReplicaClient(): Promise<RedisClient<M, F, S, RESP, TYPE_MAPPING>> {
    return this.internal.getReplicaClient();
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
  readonly #useReplicas: boolean;
  readonly #nodeClientOptions: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>;
  readonly #sentinelClientOptions: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>;

  #configEpoch: number = -1;

  #sentinelRootNodes: Array<RedisNode>;
  #sentinelClient?: RedisClientType<M, F, S, RESP, TypeMapping>;
  #pubsubClient?: RedisClientType<M, F, S, RESP, TypeMapping>;
  #masterClient?: RedisClientType<M, F, S, RESP, TypeMapping>;
  #replicaClients: Array<RedisClientType<M, F, S, RESP, TypeMapping>> = [];
  #replicaIdx: number;
  #connectPromise?: Promise<void>;
  #sentinelResetPromise?: Promise<void>;
  #maxCommandRediscovers: number;
  #watchEpoch?: number;
  #pubSubProxy: PubSubProxy<M, F, S, RESP, TypeMapping>;

  constructor(options: RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>) {
    super();

    this.#name = options.name;
    this.#useReplicas = options.useReplicas ?? false
    this.#sentinelRootNodes = Array.from(options.sentinelRootNodes);
    this.#maxCommandRediscovers = options.maxCommandRediscovers ?? 16;

    this.#nodeClientOptions = options.nodeClientOptions ? Object.assign({} as RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>, options.nodeClientOptions) : {};
    if (this.#nodeClientOptions.url !== undefined) {
      throw new Error("invalid nodeClientOptions for Sentinel");
    }

    this.#sentinelClientOptions = options.sentinelClientOptions ? Object.assign({} as RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>, options.sentinelClientOptions) : {};
    if (this.#sentinelClientOptions.url !== undefined) {
      throw new Error("invalid sentinelClientOptions for Sentinel");
    }

    this.#replicaIdx = -1;

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

        this.#masterClient = await this.#createClient(masterNode, this.#nodeClientOptions)
          .on('error', err => {
            // TODO: channel name 
            console.log("emitting master client error");
            this.emit('error', err);
          })
          .on('uncaughtException', (err) => { console.log("uncaught - " + err) })
          .connect();
        console.log("created master client to " + masterNode?.host + ":" + masterNode?.port);

        await this.#pubSubProxy.changeNode(masterNode);

        /* can work, even if cannot connect to replica nodes */
        this.#replicaClients = [];
        const replicaNodeList = createNodeList(replicas)
        for (let replicaNode of replicaNodeList) {
          if (replicaNode.port === 0) {
            continue;
          }

          console.log("replica host = " + replicaNode.host + " port = " + replicaNode.port);
          try {
            const client = await this.#createClient(replicaNode, this.#nodeClientOptions)
              .on('error', err => {
                console.log("emitting replica client error");
                // TODO: channel name
                this.emit('error', err);
              })
              .on('uncaughtException', (err) => { console.log("uncaught - " + err) })
              .connect();
            this.#replicaClients.push(client)
            console.log("created replica client to " + replicaNode.host + ":" + replicaNode.port);
          } catch (e) {
            console.log("failed to create replica client to " + replicaNode?.host + ":" + replicaNode?.port);
            console.log(e);
          }
        }

        this.#replicaIdx = -1;

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
    execType: execType | undefined,
    isReadonly: boolean | undefined,
    fn: (client: RedisClient<M, F, S, RESP, TYPE_MAPPING>) => Promise<T>
  ): Promise<T> {
    /* if not ready, wait and throw exception if doesn't become ready */
    for (let i = 0; i < this.#maxCommandRediscovers && !this.#isReady; i++) {
      await new Promise(r => setTimeout(r, 1000));
    }

    if (execType !== undefined) {
      if (execType === "WATCH" && this.#watchEpoch === undefined) {
        this.#watchEpoch = this.#configEpoch;
      } else if (execType === "UNWATCH") {
        this.#watchEpoch = undefined;
      } else if (execType === "EXEC") {
        /* need to unset on exec, if success or not */
        const watchEpoch = this.#watchEpoch;
        this.#watchEpoch = undefined;
        if (watchEpoch !== this.#configEpoch) { 
          throw new Error("sentinel config changed in middle of a WATCH Transaction");
        }
      }
    }

    let iter = 0;
    while (true) {
      let client = await this.#getClient(isReadonly, iter);
      console.log("attemping to send command to " + client.options?.socket?.host + ":" + client.options?.socket?.port)
      if (! client.isReady) {
        continue;
      }

      try {
        return await fn(client);
      } catch (err) {
        console.log("Hello: caught exception");
        if (++iter > this.#maxCommandRediscovers || !(err instanceof Error)) {
          console.log("Hello: rethrowing error");
          throw err;
        }

        if (err.message.startsWith('READONLY') || err instanceof ClientClosedError) {
          await this.#reset()
          continue;
        }

        console.log("Hello: unknwon case: " + err.message);
        throw err;
      } 
    }
  }  
  
  async #updateSentinelNodes(node: RedisNode) {
    const sentinels = await this.#sentinelClient?.sendCommand(['SENTINEL', 'SENTINELS', this.#name]);
    const list = [node]
    const sentinelList = createNodeList(sentinels)
    this.#sentinelRootNodes = list.concat(sentinelList);
  }
  
  async #getDBNodes() {
    const [master, replicas] = await Promise.all([
      this.#sentinelClient?.sendCommand(['SENTINEL', 'MASTER', this.#name]),
      this.#sentinelClient?.sendCommand(['SENTINEL', 'REPLICAS', this.#name])
    ]);

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
  
        const data = await client.sendCommand(['SENTINEL', 'MASTER', this.#name]) as Array<string>;

        /* TODO: better to use map interface */
        const epoch = Number(data[29]);

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

  #getClient(isReadonly: boolean | undefined, iter: number): RedisClientType<M, F, S, RESP, TYPE_MAPPING> {
    if (isReadonly && this.#useReplicas) {
      this.#replicaIdx = (this.#replicaIdx + 1) % this.#replicaClients.length;
      if ((this.#replicaIdx == 0 && iter >= this.#replicaClients.length) || this.#replicaClients.length == 0) {
        /* retrying nodes, attempt to use master or no replicas to read from */
        this.#replicaIdx = -1;
      }
    }

    const client = isReadonly && this.#useReplicas && this.#replicaIdx != -1 ?
      this.#replicaClients[this.#replicaIdx] :
      this.#masterClient;

    return client as RedisClientType<M, F, S, RESP, TYPE_MAPPING>;
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

    if (this.#masterClient !== undefined) {
      if (this.#masterClient.isOpen) {
        promises.push(this.#masterClient.close());
      }
      this.#masterClient = undefined;
    }

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

    if (this.#masterClient !== undefined) {
      if (this.#masterClient.isOpen) {
        this.#masterClient.destroy();
      }
      this.#masterClient = undefined
    }

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

  /* destroyed on reconfiguration, as no longer valid */
  async getMasterClient(): Promise<RedisClient<M, F, S, RESP, TYPE_MAPPING>> {
    if (this.#connectPromise !== undefined) {
      await this.#connectPromise;
    }

    if (this.#masterClient === undefined) {
      throw new Error("No master nodes detected");
    }

    const client = this.#masterClient.duplicate<M, F, S, RESP, TYPE_MAPPING>();

    this.#masterClientDupList.push(client);

    return client;
  }

  async getReplicaClient(): Promise<RedisClient<M, F, S, RESP, TYPE_MAPPING>> {
    if (this.#connectPromise !== undefined) {
      await this.#connectPromise;
    }

    if (this.#replicaClients.length == 0) {
      throw new Error("No replica nodes detected");
    }

    this.#replicaIdx = (this.#replicaIdx + 1) % this.#replicaClients.length;

    return this.#replicaClients[this.#replicaIdx].duplicate();
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

}