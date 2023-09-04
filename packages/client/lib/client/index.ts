import COMMANDS from '../commands';
import RedisSocket, { RedisSocketOptions, RedisTlsSocketOptions } from './socket';
import RedisCommandsQueue, { CommandOptions } from './commands-queue';
import { EventEmitter } from 'events';
import { attachConfig, functionArgumentsPrefix, getTransformReply, scriptArgumentsPrefix } from '../commander';
import { ClientClosedError, ClientOfflineError, DisconnectsClientError, WatchError } from '../errors';
import { URL } from 'url';
import { TcpSocketConnectOpts } from 'net';
import { PubSubType, PubSubListener, PubSubTypeListeners, ChannelListeners } from './pub-sub';
import { Command, CommandSignature, TypeMapping, CommanderConfig, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts, ReplyUnion, RespVersions, RedisArgument } from '../RESP/types';
import RedisClientMultiCommand, { RedisClientMultiCommandType } from './multi-command';
import { RedisMultiQueuedCommand } from '../multi-command';
import HELLO, { HelloOptions } from '../commands/HELLO';
import { ScanOptions, ScanCommonOptions } from '../commands/SCAN';
import { RedisLegacyClient, RedisLegacyClientType } from './legacy-mode';
import { RedisPoolOptions, RedisClientPool } from './pool';

interface ClientCommander<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends CommanderConfig<M, F, S, RESP> {
  commandOptions?: CommandOptions<TYPE_MAPPING>;
}

export interface RedisClientOptions<
  M extends RedisModules = RedisModules,
  F extends RedisFunctions = RedisFunctions,
  S extends RedisScripts = RedisScripts,
  RESP extends RespVersions = RespVersions,
  TYPE_MAPPING extends TypeMapping = TypeMapping
> extends ClientCommander<M, F, S, RESP, TYPE_MAPPING> {
  /**
   * `redis[s]://[[username][:password]@][host][:port][/db-number]`
   * See [`redis`](https://www.iana.org/assignments/uri-schemes/prov/redis) and [`rediss`](https://www.iana.org/assignments/uri-schemes/prov/rediss) IANA registration for more details
   */
  url?: string;
  /**
   * Socket connection properties
   */
  socket?: RedisSocketOptions;
  /**
   * ACL username ([see ACL guide](https://redis.io/topics/acl))
   */
  username?: string;
  /**
   * ACL password or the old "--requirepass" password
   */
  password?: string;
  /**
   * Client name ([see `CLIENT SETNAME`](https://redis.io/commands/client-setname))
   */
  name?: string;
  /**
   * Redis database number (see [`SELECT`](https://redis.io/commands/select) command)
   */
  database?: number;
  /**
   * Maximum length of the client's internal command queue
   */
  commandsQueueMaxLength?: number;
  /**
   * When `true`, commands are rejected when the client is reconnecting.
   * When `false`, commands are queued for execution after reconnection.
   */
  disableOfflineQueue?: boolean;
  /**
   * Connect in [`READONLY`](https://redis.io/commands/readonly) mode
   */
  readonly?: boolean;
  /**
   * Send `PING` command at interval (in ms).
   * Useful with Redis deployments that do not honor TCP Keep-Alive.
   */
  pingInterval?: number;
}

type WithCommands<
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
  [P in keyof typeof COMMANDS]: CommandSignature<(typeof COMMANDS)[P], RESP, TYPE_MAPPING>;
};

type WithModules<
  M extends RedisModules,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
  [P in keyof M]: {
    [C in keyof M[P]]: CommandSignature<M[P][C], RESP, TYPE_MAPPING>;
  };
};

type WithFunctions<
  F extends RedisFunctions,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
  [L in keyof F]: {
    [C in keyof F[L]]: CommandSignature<F[L][C], RESP, TYPE_MAPPING>;
  };
};

type WithScripts<
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
  [P in keyof S]: CommandSignature<S[P], RESP, TYPE_MAPPING>;
};

export type RedisClientExtensions<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> = (
  WithCommands<RESP, TYPE_MAPPING> &
  WithModules<M, RESP, TYPE_MAPPING> &
  WithFunctions<F, RESP, TYPE_MAPPING> &
  WithScripts<S, RESP, TYPE_MAPPING>
);

export type RedisClientType<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> = (
  RedisClient<M, F, S, RESP, TYPE_MAPPING> &
  RedisClientExtensions<M, F, S, RESP, TYPE_MAPPING>
);

type ProxyClient = RedisClient<any, any, any, any, any>;

type NamespaceProxyClient = { self: ProxyClient };

interface ScanIteratorOptions {
  cursor?: RedisArgument;
}

export default class RedisClient<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends EventEmitter {
  private static _createCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: ProxyClient, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        reply = await this.sendCommand(redisArgs, this._commandOptions);
      return transformReply ?
        transformReply(reply, redisArgs.preserve) :
        reply;
    };
  }

  private static _createModuleCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: NamespaceProxyClient, ...args: Array<unknown>) {
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
    return async function (this: NamespaceProxyClient, ...args: Array<unknown>) {
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
    return async function (this: ProxyClient, ...args: Array<unknown>) {
      const scriptArgs = script.transformArguments(...args),
        redisArgs = prefix.concat(scriptArgs),
        reply = await this.executeScript(script, redisArgs, this._commandOptions);
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
  >(config?: ClientCommander<M, F, S, RESP, TYPE_MAPPING>) {
    const Client = attachConfig({
      BaseClass: RedisClient,
      commands: COMMANDS,
      createCommand: RedisClient._createCommand,
      createModuleCommand: RedisClient._createModuleCommand,
      createFunctionCommand: RedisClient._createFunctionCommand,
      createScriptCommand: RedisClient._createScriptCommand,
      config
    });

    Client.prototype.Multi = RedisClientMultiCommand.extend(config);

    return (options?: Omit<RedisClientOptions, keyof Exclude<typeof config, undefined>>) => {
      // returning a "proxy" to prevent the namespaces.self to leak between "proxies"
      return Object.create(new Client(options)) as RedisClientType<M, F, S, RESP, TYPE_MAPPING>;
    };
  }

  static create<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
  >(this: void, options?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>) {
    return RedisClient.factory(options)(options);
  }

  static parseURL(url: string): RedisClientOptions {
    // https://www.iana.org/assignments/uri-schemes/prov/redis
    const { hostname, port, protocol, username, password, pathname } = new URL(url),
      parsed: RedisClientOptions = {
        socket: {
          host: hostname
        }
      };

    if (protocol === 'rediss:') {
      (parsed.socket as RedisTlsSocketOptions).tls = true;
    } else if (protocol !== 'redis:') {
      throw new TypeError('Invalid protocol');
    }

    if (port) {
      (parsed.socket as TcpSocketConnectOpts).port = Number(port);
    }

    if (username) {
      parsed.username = decodeURIComponent(username);
    }

    if (password) {
      parsed.password = decodeURIComponent(password);
    }

    if (pathname.length > 1) {
      const database = Number(pathname.substring(1));
      if (isNaN(database)) {
        throw new TypeError('Invalid pathname');
      }

      parsed.database = database;
    }

    return parsed;
  }

  self = this;

  private readonly _options?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>;
  private readonly _socket: RedisSocket;
  private readonly _queue: RedisCommandsQueue;
  private _selectedDB = 0;
  private _commandOptions?: CommandOptions<TYPE_MAPPING>;

  get options(): RedisClientOptions<M, F, S, RESP> | undefined {
    return this._options;
  }

  get isOpen(): boolean {
    return this._socket.isOpen;
  }

  get isReady(): boolean {
    return this._socket.isReady;
  }

  get isPubSubActive() {
    return this._queue.isPubSubActive;
  }

  constructor(options?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>) {
    super();
    this._options = this._initiateOptions(options);
    this._queue = this._initiateQueue();
    this._socket = this._initiateSocket();
  }

  private _initiateOptions(options?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>): RedisClientOptions<M, F, S, RESP, TYPE_MAPPING> | undefined {
    if (options?.url) {
      const parsed = RedisClient.parseURL(options.url);
      if (options.socket) {
        parsed.socket = Object.assign(options.socket, parsed.socket);
      }

      Object.assign(options, parsed);
    }

    if (options?.database) {
      this._selectedDB = options.database;
    }

    if (options?.commandOptions) {
      this._commandOptions = options.commandOptions;
    }

    return options;
  }

  private _initiateQueue(): RedisCommandsQueue {
    return new RedisCommandsQueue(
      this._options?.RESP,
      this._options?.commandsQueueMaxLength,
      (channel, listeners) => this.emit('sharded-channel-moved', channel, listeners)
    );
  }

  private _initiateSocket(): RedisSocket {
    const socketInitiator = async (): Promise<void> => {
      const promises = [];

      if (this._selectedDB !== 0) {
        promises.push(
          this._queue.addCommand(
            ['SELECT', this._selectedDB.toString()],
            { asap: true }
          )
        );
      }

      if (this._options?.readonly) {
        promises.push(
          this._queue.addCommand(
            COMMANDS.READONLY.transformArguments(),
            { asap: true }
          )
        );
      }

      if (this._options?.RESP) {
        const hello: HelloOptions = {};

        if (this._options.password) {
          hello.AUTH = {
            username: this._options.username ?? 'default',
            password: this._options.password
          };
        }

        if (this._options.name) {
          hello.SETNAME = this._options.name;
        }

        promises.push(
          this._queue.addCommand(
            HELLO.transformArguments(this._options.RESP, hello),
            { asap: true }
          )
        );
      } else {
        if (this._options?.name) {
          promises.push(
            this._queue.addCommand(
              COMMANDS.CLIENT_SETNAME.transformArguments(this._options.name),
              { asap: true }
            )
          );
        }

        if (this._options?.username || this._options?.password) {
          promises.push(
            this._queue.addCommand(
              COMMANDS.AUTH.transformArguments({
                username: this._options.username,
                password: this._options.password ?? ''
              }),
              { asap: true }
            )
          );
        }
      }

      const resubscribePromise = this._queue.resubscribe();
      if (resubscribePromise) {
        promises.push(resubscribePromise);
      }

      if (promises.length) {
        this._write();
        await Promise.all(promises);
      }
    };

    return new RedisSocket(socketInitiator, this._options?.socket)
      .on('data', chunk => {
        try {
          this._queue.decoder.write(chunk);
        } catch (err) {
          this._queue.decoder.reset();
          this.emit('error', err);
        }
      })
      .on('error', err => {
        this.emit('error', err);
        if (this._socket.isOpen && !this._options?.disableOfflineQueue) {
          this._queue.flushWaitingForReply(err);
        } else {
          this._queue.flushAll(err);
        }
      })
      .on('connect', () => this.emit('connect'))
      .on('ready', () => {
        this.emit('ready');
        this._setPingTimer();
        this._maybeScheduleWrite();
      })
      .on('reconnecting', () => this.emit('reconnecting'))
      .on('drain', () => this._maybeScheduleWrite())
      .on('end', () => this.emit('end'));
  }

  private _pingTimer?: NodeJS.Timer;

  private _setPingTimer(): void {
    if (!this._options?.pingInterval || !this._socket.isReady) return;
    clearTimeout(this._pingTimer);

    this._pingTimer = setTimeout(() => {
      if (!this._socket.isReady) return;

      this.sendCommand(['PING'])
        .then(reply => this.emit('ping-interval', reply))
        .catch(err => this.emit('error', err))
        .finally(() => this._setPingTimer());
    }, this._options.pingInterval);
  }

  withCommandOptions<
    OPTIONS extends CommandOptions<TYPE_MAPPING>,
    TYPE_MAPPING extends TypeMapping
  >(options: OPTIONS) {
    const proxy = Object.create(this.self);
    proxy._commandOptions = options;
    return proxy as RedisClientType<
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
    proxy._commandOptions = Object.create(this._commandOptions ?? null);
    proxy._commandOptions[key] = value;
    return proxy as RedisClientType<
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
   */
  asap() {
    return this._commandOptionsProxy('asap', true);
  }

  /**
   * Create the "legacy" (v3/callback) interface
   */
  legacy(): RedisLegacyClientType {
    return new RedisLegacyClient(
      this as unknown as RedisClientType<M, F, S>
    ) as RedisLegacyClientType;
  }

  /**
   * Create {@link RedisClientPool `RedisClientPool`} using this client as a prototype
   */
  pool(options?: Partial<RedisPoolOptions>) {
    return RedisClientPool.create(
      this._options,
      options
    );
  }

  duplicate<
    _M extends RedisModules = M,
    _F extends RedisFunctions = F,
    _S extends RedisScripts = S,
    _RESP extends RespVersions = RESP,
    _TYPE_MAPPING extends TypeMapping = TYPE_MAPPING
  >(overrides?: Partial<RedisClientOptions<_M, _F, _S, _RESP, _TYPE_MAPPING>>) {
    return new (Object.getPrototypeOf(this).constructor)({
      ...this._options,
      commandOptions: this._commandOptions,
      ...overrides
    }) as RedisClientType<_M, _F, _S, _RESP, _TYPE_MAPPING>;
  }

  async connect() {
    await this._socket.connect();
    return this as unknown as RedisClientType<M, F, S, RESP, TYPE_MAPPING>;
  }

  sendCommand<T = ReplyUnion>(
    args: Array<RedisArgument>,
    options?: CommandOptions
  ): Promise<T> {
    if (!this._socket.isOpen) {
      return Promise.reject(new ClientClosedError());
    } else if (!this._socket.isReady && this._options?.disableOfflineQueue) {
      return Promise.reject(new ClientOfflineError());
    }

    const promise = this._queue.addCommand<T>(args, options);
    this._scheduleWrite();
    return promise;
  }

  async executeScript(
    script: RedisScript,
    args: Array<RedisArgument>,
    options?: CommandOptions
  ) {
    try {
      return await this.sendCommand(args, options);
    } catch (err) {
      if (!(err as Error)?.message?.startsWith?.('NOSCRIPT')) throw err;

      args[0] = 'EVAL';
      args[1] = script.SCRIPT;
      return await this.sendCommand(args, options);
    }
  }

  async SELECT(db: number): Promise<void> {
    await this.sendCommand(['SELECT', db.toString()]);
    this._selectedDB = db;
  }

  select = this.SELECT;

  private _pubSubCommand(promise: Promise<void> | undefined) {
    if (promise === undefined) return Promise.resolve();

    this._scheduleWrite();
    return promise;
  }

  SUBSCRIBE<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ): Promise<void> {
    return this._pubSubCommand(
      this._queue.subscribe(
        PubSubType.CHANNELS,
        channels,
        listener,
        bufferMode
      )
    );
  }

  subscribe = this.SUBSCRIBE;

  UNSUBSCRIBE<T extends boolean = false>(
    channels?: string | Array<string>,
    listener?: PubSubListener<T>,
    bufferMode?: T
  ): Promise<void> {
    return this._pubSubCommand(
      this._queue.unsubscribe(
        PubSubType.CHANNELS,
        channels,
        listener,
        bufferMode
      )
    );
  }

  unsubscribe = this.UNSUBSCRIBE

  PSUBSCRIBE<T extends boolean = false>(
    patterns: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ): Promise<void> {
    return this._pubSubCommand(
      this._queue.subscribe(
        PubSubType.PATTERNS,
        patterns,
        listener,
        bufferMode
      )
    );
  }

  pSubscribe = this.PSUBSCRIBE;

  PUNSUBSCRIBE<T extends boolean = false>(
    patterns?: string | Array<string>,
    listener?: PubSubListener<T>,
    bufferMode?: T
  ): Promise<void> {
    return this._pubSubCommand(
      this._queue.unsubscribe(
        PubSubType.PATTERNS,
        patterns,
        listener,
        bufferMode
      )
    );
  }

  pUnsubscribe = this.PUNSUBSCRIBE;

  SSUBSCRIBE<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ): Promise<void> {
    return this._pubSubCommand(
      this._queue.subscribe(
        PubSubType.SHARDED,
        channels,
        listener,
        bufferMode
      )
    );
  }

  sSubscribe = this.SSUBSCRIBE;

  SUNSUBSCRIBE<T extends boolean = false>(
    channels?: string | Array<string>,
    listener?: PubSubListener<T>,
    bufferMode?: T
  ): Promise<void> {
    return this._pubSubCommand(
      this._queue.unsubscribe(
        PubSubType.SHARDED,
        channels,
        listener,
        bufferMode
      )
    );
  }

  sUnsubscribe = this.SUNSUBSCRIBE;

  getPubSubListeners(type: PubSubType) {
    return this._queue.getPubSubListeners(type);
  }

  extendPubSubChannelListeners(
    type: PubSubType,
    channel: string,
    listeners: ChannelListeners
  ) {
    return this._pubSubCommand(
      this._queue.extendPubSubChannelListeners(type, channel, listeners)
    );
  }

  extendPubSubListeners(type: PubSubType, listeners: PubSubTypeListeners) {
    return this._pubSubCommand(
      this._queue.extendPubSubListeners(type, listeners)
    );
  }

  private _write() {
    this._socket.write(this._queue.commandsToWrite());
  }

  private _scheduledWrite?: NodeJS.Immediate;

  private _scheduleWrite() {
    if (!this.isReady || this._scheduledWrite) return;

    this._scheduledWrite = setImmediate(() => {
      this._write();
      this._scheduledWrite = undefined;
    });
  }

  private _maybeScheduleWrite() {
    if (!this._queue.isWaitingToWrite()) return;

    this._scheduleWrite();
  }

  /**
   * @internal
   */
  _executePipeline(commands: Array<RedisMultiQueuedCommand>) {
    if (!this._socket.isOpen) {
      return Promise.reject(new ClientClosedError());
    }

    const promise = Promise.all(
      commands.map(({ args }) => this._queue.addCommand(args, {
        typeMapping: this._commandOptions?.typeMapping
      }))
    );
    this._scheduleWrite();
    return promise;
  }

  /**
   * @internal
   */
  async _executeMulti(
    commands: Array<RedisMultiQueuedCommand>,
    selectedDB?: number
  ) {
    if (!this._socket.isOpen) {
      return Promise.reject(new ClientClosedError());
    }

    const typeMapping = this._commandOptions?.typeMapping,
      chainId = Symbol('MULTI Chain'),
      promises = [
        this._queue.addCommand(['MULTI'], { chainId }),
      ];

    for (const { args } of commands) {
      promises.push(
        this._queue.addCommand(args, {
          chainId,
          typeMapping
        })
      );
    }

    promises.push(
      this._queue.addCommand(['EXEC'], { chainId })
    );

    this._scheduleWrite();

    const results = await Promise.all(promises),
      execResult = results[results.length - 1];

    if (execResult === null) {
      throw new WatchError();
    }

    if (selectedDB !== undefined) {
      this._selectedDB = selectedDB;
    }

    return execResult as Array<unknown>;
  }

  MULTI(): RedisClientMultiCommandType<[], M, F, S, RESP, TYPE_MAPPING> {
    return new (this as any).Multi(this);
  }

  multi = this.MULTI;

  async* scanIterator(
    this: RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
    options?: ScanOptions & ScanIteratorOptions
  ) {
    let cursor = options?.cursor ?? '0';
    do {
      const reply = await this.scan(cursor, options);
      cursor = reply.cursor;
      yield reply.keys;
    } while (cursor !== '0');
  }

  async* hScanIterator(
    this: RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
    key: RedisArgument,
    options?: ScanCommonOptions & ScanIteratorOptions
  ) {
    let cursor = options?.cursor ?? '0';
    do {
      const reply = await this.hScan(key, cursor, options);
      cursor = reply.cursor;
      yield reply.entries;
    } while (cursor !== '0');
  }

  async* sScanIterator(
    this: RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
    key: RedisArgument,
    options?: ScanCommonOptions & ScanIteratorOptions
  ) {
    let cursor = options?.cursor ?? '0';
    do {
      const reply = await this.sScan(key, cursor, options);
      cursor = reply.cursor;
      yield reply.members;
    } while (cursor !== '0');
  }

  async* zScanIterator(
    this: RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
    key: RedisArgument,
    options?: ScanCommonOptions & ScanIteratorOptions
  ) {
    let cursor = options?.cursor ?? '0';
    do {
      const reply = await this.zScan(key, cursor, options);
      cursor = reply.cursor;
      yield reply.members;
    } while (cursor !== '0');
  }

  /**
   * @deprecated use .close instead
   */
  QUIT(): Promise<string> {
    return this._socket.quit(async () => {
      clearTimeout(this._pingTimer);
      const quitPromise = this._queue.addCommand<string>(['QUIT']);
      this._scheduleWrite();
      return quitPromise;
    });
  }

  quit = this.QUIT;

  /**
   * @deprecated use .destroy instead
   */
  disconnect() {
    return Promise.resolve(this.destroy());
  }

  /**
   * Close the client. Wait for pending commands.
   */
  close() {
    return new Promise<void>(resolve => {
      clearTimeout(this._pingTimer);
      this._socket.close();

      if (this._queue.isEmpty()) {
        this._socket.destroySocket();
        return resolve();
      }

      const maybeClose = () => {
        if (!this._queue.isEmpty()) return;

        this._socket.off('data', maybeClose);
        this._socket.destroySocket();
        resolve();
      };
      this._socket.on('data', maybeClose);
    });
  }

  /**
   * Destroy the client. Rejects all commands immediately.
   */
  destroy() {
    clearTimeout(this._pingTimer);
    this._queue.flushAll(new DisconnectsClientError());
    this._socket.destroy();
  }

  ref() {
    this._socket.ref();
  }

  unref() {
    this._socket.unref();
  }
}
