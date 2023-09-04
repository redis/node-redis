import COMMANDS from '../commands';
import { Command, RedisArgument, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts, RespVersions, TypeMapping } from '../RESP/types';
import RedisClient, { RedisClientType, RedisClientOptions, RedisClientExtensions } from '.';
import { EventEmitter } from 'events';
import { DoublyLinkedNode, DoublyLinkedList, SinglyLinkedList } from './linked-list';
import { TimeoutError } from '../errors';
import { attachConfig, functionArgumentsPrefix, getTransformReply, scriptArgumentsPrefix } from '../commander';
import { CommandOptions } from './commands-queue';

export interface RedisPoolOptions {
  /**
   * The minimum number of clients to keep in the pool (>= 1).
   */
  minimum: number;
  /**
   * The maximum number of clients to keep in the pool (>= {@link RedisPoolOptions.minimum} >= 1).
   */
  maximum: number;
  /**
   * The maximum time a task can wait for a client to become available (>= 0).
   */
  acquireTimeout: number;
  /**
   * TODO
   */
  cleanupDelay: number;
}

export type PoolTask<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping,
  T = unknown
> = (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>) => T;

export type RedisClientPoolType<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> = (
  RedisClientPool<M, F, S, RESP, TYPE_MAPPING> &
  RedisClientExtensions<M, F, S, RESP, TYPE_MAPPING>
);

type ProxyPool = RedisClientPoolType<any, any, any, any, any>;

type NamespaceProxyPool = { self: ProxyPool };

export class RedisClientPool<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> extends EventEmitter {
  private static _createCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: ProxyPool, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        reply = await this.sendCommand(redisArgs, this._commandOptions);
      return transformReply ?
        transformReply(reply, redisArgs.preserve) :
        reply;
    };
  }

  private static _createModuleCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: NamespaceProxyPool, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        reply = await this.self.sendCommand(redisArgs, this.self._commandOptions);
      return transformReply ?
        transformReply(reply, redisArgs.preserve) :
        reply;
    };
  }

  private static _createFunctionCommand(name: string, fn: RedisFunction, resp: RespVersions) {
    const prefix = functionArgumentsPrefix(name, fn),
      transformReply = getTransformReply(fn, resp);
    return async function (this: NamespaceProxyPool, ...args: Array<unknown>) {
      const fnArgs = fn.transformArguments(...args),
        reply = await this.self.sendCommand(
          prefix.concat(fnArgs),
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
    return async function (this: ProxyPool, ...args: Array<unknown>) {
      const scriptArgs = script.transformArguments(...args),
        redisArgs = prefix.concat(scriptArgs),
        reply = await this.executeScript(script, redisArgs, this._commandOptions);
      return transformReply ?
        transformReply(reply, scriptArgs.preserve) :
        reply;
    };
  }

  static create<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts,
    RESP extends RespVersions,
    TYPE_MAPPING extends TypeMapping = {}
  >(
    // clientFactory: () => RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
    clientOptions?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>,
    options?: Partial<RedisPoolOptions>
  ) {
    // @ts-ignore
    const Pool = attachConfig({
      BaseClass: RedisClientPool,
      commands: COMMANDS,
      createCommand: RedisClientPool._createCommand,
      createModuleCommand: RedisClientPool._createModuleCommand,
      createFunctionCommand: RedisClientPool._createFunctionCommand,
      createScriptCommand: RedisClientPool._createScriptCommand,
      config: clientOptions
    });

    // returning a "proxy" to prevent the namespaces.self to leak between "proxies"
    return Object.create(
      new Pool(
        RedisClient.factory(clientOptions).bind(undefined, clientOptions),
        options
      )
    ) as RedisClientPoolType<M, F, S, RESP, TYPE_MAPPING>;
  }

  // TODO: defaults
  private static _DEFAULTS = {
    minimum: 1,
    maximum: 100,
    acquireTimeout: 3000,
    cleanupDelay: 3000
  } satisfies RedisPoolOptions;

  private readonly _clientFactory: () => RedisClientType<M, F, S, RESP, TYPE_MAPPING>;
  private readonly _options: RedisPoolOptions;

  private readonly _idleClients = new SinglyLinkedList<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>();

  /**
   * The number of idle clients.
   */
  get idleClients() {
    return this._idleClients.length;
  }

  private readonly _clientsInUse = new DoublyLinkedList<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>();

  /**
   * The number of clients in use.
   */
  get clientsInUse() {
    return this._clientsInUse.length;
  }

  private readonly _connectingClients = 0;

  /**
   * The number of clients that are currently connecting.
   */
  get connectingClients() {
    return this._connectingClients;
  }

  /**
   * The total number of clients in the pool (including connecting, idle, and in use).
   */
  get totalClients() {
    return this._idleClients.length + this._clientsInUse.length;
  }

  private readonly _tasksQueue = new SinglyLinkedList<{
    timeout: NodeJS.Timeout | undefined;
    resolve: (value: unknown) => unknown;
    reject: (reason?: unknown) => unknown;
    fn: PoolTask<M, F, S, RESP, TYPE_MAPPING>;
  }>();

  /**
   * The number of tasks waiting for a client to become available.
   */
  get tasksQueueLength() {
    return this._tasksQueue.length;
  }

  private _isOpen = false;

  /**
   * Whether the pool is open (either connecting or connected).
   */
  get isOpen() {
    return this._isOpen;
  }

  private _isClosing = false;

  /**
   * Whether the pool is closing (*not* closed).
   */
  get isClosing() {
    return this._isClosing;
  }

  /**
   * You are probably looking for {@link RedisClient.pool `RedisClient.pool`},
   * {@link RedisClientPool.fromClient `RedisClientPool.fromClient`},
   * or {@link RedisClientPool.fromOptions `RedisClientPool.fromOptions`}...
   */
  constructor(
    clientFactory: () => RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
    options?: Partial<RedisPoolOptions>
  ) {
    super();

    this._clientFactory = clientFactory;
    this._options = {
      ...RedisClientPool._DEFAULTS,
      ...options
    };
  }

  private _self = this;
  private _commandOptions?: CommandOptions<TYPE_MAPPING>;

  withCommandOptions<
    OPTIONS extends CommandOptions<TYPE_MAPPING>,
    TYPE_MAPPING extends TypeMapping
  >(options: OPTIONS) {
    const proxy = Object.create(this._self);
    proxy._commandOptions = options;
    return proxy as RedisClientPoolType<
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
    const proxy = Object.create(this._self);
    proxy._commandOptions = Object.create(this._commandOptions ?? null);
    proxy._commandOptions[key] = value;
    return proxy as RedisClientPoolType<
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

  /**
   * Override the `abortSignal` command option
   */
  withAbortSignal(abortSignal: AbortSignal) {
    return this._commandOptionsProxy('abortSignal', abortSignal);
  }

  /**
   * Override the `asap` command option to `true`
   * TODO: remove?
   */
  asap() {
    return this._commandOptionsProxy('asap', true);
  }

  async connect() {
    if (this._isOpen) return; // TODO: throw error?

    this._isOpen = true;

    const promises = [];
    while (promises.length < this._options.minimum) {
      promises.push(this._create());
    }

    try {
      await Promise.all(promises);
      return this as unknown as RedisClientPoolType<M, F, S, RESP, TYPE_MAPPING>;
    } catch (err) {
      this.destroy();
      throw err;
    }
  }

  private async _create() {
    const node = this._clientsInUse.push(
      this._clientFactory()
        .on('error', (err: Error) => this.emit('error', err))
    );

    try {
      await node.value.connect();
    } catch (err) {
      this._clientsInUse.remove(node);
      throw err;
    }

    this._returnClient(node);
  }
  
  execute<T>(fn: PoolTask<M, F, S, RESP, TYPE_MAPPING, T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const client = this._idleClients.shift(),
        { tail } = this._tasksQueue;
      if (!client) {
        let timeout;
        if (this._options.acquireTimeout > 0) {
          timeout = setTimeout(
            () => {
              this._tasksQueue.remove(task, tail);
              reject(new TimeoutError('Timeout waiting for a client')); // TODO: message
            },
            this._options.acquireTimeout
          );
        }

        const task = this._tasksQueue.push({
          timeout,
          // @ts-ignore
          resolve,
          reject,
          fn
        });

        if (this.totalClients < this._options.maximum) {
          this._create();
        }

        return;
      }

      const node = this._clientsInUse.push(client);
      // @ts-ignore
      this._executeTask(node, resolve, reject, fn);
    });
  }

  private _executeTask(
    node: DoublyLinkedNode<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>,
    resolve: <T>(value: T | PromiseLike<T>) => void,
    reject: (reason?: unknown) => void,
    fn: PoolTask<M, F, S, RESP, TYPE_MAPPING>
  ) {
    const result = fn(node.value);
    if (result instanceof Promise) {
      result.then(resolve, reject);
      result.finally(() => this._returnClient(node))
    } else {
      resolve(result);
      this._returnClient(node);
    }
  }

  private _returnClient(node: DoublyLinkedNode<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>) {
    const task = this._tasksQueue.shift();
    if (task) {
      this._executeTask(node, task.resolve, task.reject, task.fn);
      return;
    }

    this._clientsInUse.remove(node);
    this._idleClients.push(node.value);

    this._scheduleCleanup();
  }

  cleanupTimeout?: NodeJS.Timeout;

  private _scheduleCleanup() {
    if (this.totalClients <= this._options.minimum) return;

    clearTimeout(this.cleanupTimeout);
    this.cleanupTimeout = setTimeout(() => this._cleanup(), this._options.cleanupDelay);
  }

  private _cleanup() {
    const toDestroy = Math.min(this._idleClients.length, this.totalClients - this._options.minimum);
    for (let i = 0; i < toDestroy; i++) {
      // TODO: shift vs pop
      this._idleClients.shift()!.destroy();
    }
  }

  sendCommand(
    args: Array<RedisArgument>,
    options?: CommandOptions
  ) {
    return this.execute(client => client.sendCommand(args, options));
  }

  executeScript(
    script: RedisScript,
    args: Array<RedisArgument>,
    options?: CommandOptions
  ) {
    return this.execute(client => client.executeScript(script, args, options));
  }

  async close() {
    if (this._isClosing) return; // TODO: throw err?
    if (!this._isOpen) return; // TODO: throw err?

    this._isClosing = true;
    
    try {
      const promises = [];

      for (const client of this._idleClients) {
        promises.push(client.close());
      }
  
      for (const client of this._clientsInUse) {
        promises.push(client.close());
      }
  
      await Promise.all(promises);
  
      this._idleClients.reset();
      this._clientsInUse.reset();
    } catch (err) {
      
    } finally {
      this._isClosing = false;
    } 
  }

  destroy() {
    for (const client of this._idleClients) {
      client.destroy();
    }
    this._idleClients.reset();

    for (const client of this._clientsInUse) {
      client.destroy();
    }
    this._clientsInUse.reset();

    this._isOpen = false;
  }
}
