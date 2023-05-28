import COMMANDS from '../commands';
import RedisSocket, { RedisSocketOptions, RedisTlsSocketOptions } from './socket';
import RedisCommandsQueue, { QueueCommandOptions } from './commands-queue';
import { EventEmitter } from 'events';
import { attachConfig, functionArgumentsPrefix, getTransformReply, scriptArgumentsPrefix } from '../commander';
import { ClientClosedError, ClientOfflineError, DisconnectsClientError } from '../errors';
import { URL } from 'url';
import { TcpSocketConnectOpts } from 'net';
import { PubSubType, PubSubListener, PubSubTypeListeners, ChannelListeners } from './pub-sub';
import { Command, CommandArguments, CommandSignature, Flags, CommanderConfig, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts, ReplyUnion, RespVersions, RedisArgument } from '../RESP/types';
import RedisClientMultiCommand, { RedisClientMultiCommandType } from './multi-command';
import { RedisMultiQueuedCommand } from '../multi-command';
import HELLO, { HelloOptions } from '../commands/HELLO';
import { ReplyWithFlags, CommandReply } from '../RESP/types';
import SCAN, { ScanOptions, ScanCommonOptions } from '../commands/SCAN';
import { RedisLegacyClient, RedisLegacyClientType } from './legacy-mode';
import { RedisClientPool } from './pool';

export interface RedisClientOptions<
  M extends RedisModules = RedisModules,
  F extends RedisFunctions = RedisFunctions,
  S extends RedisScripts = RedisScripts,
  RESP extends RespVersions = RespVersions
> extends CommanderConfig<M, F, S, RESP> {
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
   * Useful with Redis deployments that do not use TCP Keep-Alive.
   */
  pingInterval?: number;
}

type WithCommands<
  RESP extends RespVersions,
  FLAGS extends Flags
> = {
    [P in keyof typeof COMMANDS]: CommandSignature<(typeof COMMANDS)[P], RESP, FLAGS>;
  };

type WithModules<
  M extends RedisModules,
  RESP extends RespVersions,
  FLAGS extends Flags
> = {
    [P in keyof M]: {
      [C in keyof M[P]]: CommandSignature<M[P][C], RESP, FLAGS>;
    };
  };

type WithFunctions<
  F extends RedisFunctions,
  RESP extends RespVersions,
  FLAGS extends Flags
> = {
    [L in keyof F]: {
      [C in keyof F[L]]: CommandSignature<F[L][C], RESP, FLAGS>;
    };
  };

type WithScripts<
  S extends RedisScripts,
  RESP extends RespVersions,
  FLAGS extends Flags
> = {
    [P in keyof S]: CommandSignature<S[P], RESP, FLAGS>;
  };

export type RedisClientType<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  FLAGS extends Flags = {}
> = (
    RedisClient<M, F, S, RESP, FLAGS> &
    WithCommands<RESP, FLAGS> &
    WithModules<M, RESP, FLAGS> &
    WithFunctions<F, RESP, FLAGS> &
    WithScripts<S, RESP, FLAGS>
  );

export interface ClientCommandOptions extends QueueCommandOptions {
  // isolated?: boolean;
}

type ProxyClient = RedisClient<{}, {}, {}, RespVersions, Flags> & { commandOptions?: ClientCommandOptions };

type NamespaceProxyClient = { self: ProxyClient };

interface ScanIteratorOptions {
  cursor?: number;
}

export default class RedisClient<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  FLAGS extends Flags
> extends EventEmitter {
  private static _createCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: ProxyClient, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        reply = await this.sendCommand(redisArgs, this.commandOptions);
      return transformReply ?
        transformReply(reply, redisArgs.preserve) :
        reply;
    };
  }

  private static _createModuleCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: NamespaceProxyClient, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        reply = await this.self.sendCommand(redisArgs, this.self.commandOptions);
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
          this.self.commandOptions
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
        reply = await this.sendCommand(redisArgs, this.commandOptions).catch((err: unknown) => {
          if (!(err as Error)?.message?.startsWith?.('NOSCRIPT')) throw err;

          args[0] = 'EVAL';
          args[1] = script.SCRIPT;
          return this.sendCommand(redisArgs, this.commandOptions);
        });
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
    const Client = attachConfig({
      BaseClass: RedisClient,
      commands: COMMANDS,
      createCommand: RedisClient._createCommand,
      createFunctionCommand: RedisClient._createFunctionCommand,
      createModuleCommand: RedisClient._createModuleCommand,
      createScriptCommand: RedisClient._createScriptCommand,
      config
    });

    Client.prototype.Multi = RedisClientMultiCommand.extend(config);

    return (options?: Omit<RedisClientOptions, keyof Exclude<typeof config, undefined>>) => {
      // returning a proxy of the client to prevent the namespaces.self to leak between proxies
      // namespaces will be bootstraped on first access per proxy
      return Object.create(new Client(options)) as RedisClientType<M, F, S, RESP>;
    };
  }

  static create<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2
  >(this: void, options?: RedisClientOptions<M, F, S, RESP>) {
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

  private readonly _options?: RedisClientOptions<M, F, S, RESP>;
  private readonly _socket: RedisSocket;
  private readonly _queue: RedisCommandsQueue;
  private _selectedDB = 0;

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

  constructor(options?: RedisClientOptions<M, F, S, RESP>) {
    super();
    this._options = this._initiateOptions(options);
    this._queue = this._initiateQueue();
    this._socket = this._initiateSocket();
  }

  private _initiateOptions(options?: RedisClientOptions<M, F, S, RESP>): RedisClientOptions<M, F, S, RESP> | undefined {
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
        this._tick(true);
        await Promise.all(promises);
      }
    };

    return new RedisSocket(socketInitiator, this._options?.socket)
      .on('data', chunk => this._queue.decoder.write(chunk))
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
        this._tick();
      })
      .on('reconnecting', () => this.emit('reconnecting'))
      .on('drain', () => this._tick())
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

  withCommandOptions<T extends ClientCommandOptions>(options: T) {
    const proxy = Object.create(this.self);
    proxy.commandOptions = options;
    return proxy as RedisClientType<
      M,
      F,
      S,
      RESP,
      T['flags'] extends Flags ? T['flags'] : {}
    >;
  }

  private _commandOptionsProxy<
    K extends keyof ClientCommandOptions,
    V extends ClientCommandOptions[K]
  >(
    key: K,
    value: V
  ) {
    const proxy = Object.create(this.self);
    proxy.commandOptions = Object.create((this as unknown as ProxyClient).commandOptions ?? null);
    proxy.commandOptions[key] = value;
    return proxy as RedisClientType<
      M,
      F,
      S,
      RESP,
      K extends 'flags' ? V extends Flags ? V : {} : FLAGS
    >;
  }

  /**
   * Override the `flags` command option
   */
  withFlags<FLAGS extends Flags>(flags: FLAGS) {
    return this._commandOptionsProxy('flags', flags);
  }

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
   * Get the "legacy" (v3/callback) interface
   */
  legacy(): RedisLegacyClientType {
    return new RedisLegacyClient(
      this as unknown as RedisClientType<M, F, S>
    ) as RedisLegacyClientType;
  }

  /**
   * Create `RedisClientPool` using this client as a prototype
   */
  pool() {
    return RedisClientPool.fromClient(
      this as unknown as RedisClientType<M, F, S, RESP>
    );
  }

  duplicate(overrides?: Partial<RedisClientOptions<M, F, S, RESP>>) {
    return new (Object.getPrototypeOf(this).constructor)({
      ...this._options,
      ...overrides
    }) as RedisClientType<M, F, S, RESP>;
  }

  connect() {
    return this._socket.connect();
  }

  sendCommand<T = ReplyUnion>(
    args: CommandArguments,
    options?: ClientCommandOptions
  ): Promise<T> {
    if (!this._socket.isOpen) {
      return Promise.reject(new ClientClosedError());
    } else if (!this._socket.isReady && this._options?.disableOfflineQueue) {
      return Promise.reject(new ClientOfflineError());
    }

    const promise = this._queue.addCommand<T>(args, options);
    this._tick();
    return promise;
  }

  async SELECT(db: number): Promise<void> {
    await this.sendCommand(['SELECT', db.toString()]);
    this._selectedDB = db;
  }

  select = this.SELECT;

  private _pubSubCommand(promise: Promise<void> | undefined) {
    if (promise === undefined) return Promise.resolve();

    this._tick();
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

  private _tick(force = false): void {
    if (this._socket.writableNeedDrain || (!force && !this._socket.isReady)) {
      return;
    }

    this._socket.cork();

    do {
      const args = this._queue.getCommandToSend();
      if (args === undefined) break;

      this._socket.writeCommand(args);
    } while (!this._socket.writableNeedDrain);
  }

  private _addMultiCommands(
    commands: Array<RedisMultiQueuedCommand>,
    chainId?: symbol,
    flags?: Flags
  ) {
    return Promise.all(
      commands.map(({ args }) => this._queue.addCommand(args, {
        chainId,
        flags
      }))
    );
  }

  /**
   * @internal
   */
  async executePipeline(commands: Array<RedisMultiQueuedCommand>) {
    if (!this._socket.isOpen) {
      return Promise.reject(new ClientClosedError());
    }

    const promise = Promise.all(
      commands.map(({ args }) => this._queue.addCommand(args, {
        flags: (this as ProxyClient).commandOptions?.flags
      }))
    );
    this._tick();
    return promise;
  }

  /**
   * @internal
   */
  async executeMulti(
        commands: Array<RedisMultiQueuedCommand>,
    selectedDB?: number
  ) {
        if (!this._socket.isOpen) {
          return Promise.reject(new ClientClosedError());
        }

        const flags = (this as ProxyClient).commandOptions?.flags,
      chainId = Symbol('MULTI Chain'),
      promises = [
              this._queue.addCommand(['MULTI'], { chainId }),
      ];

    for (const { args } of commands) {
      promises.push(
        this._queue.addCommand(args, {
          chainId,
          flags
        })
      );
    }

    promises.push(
      this._queue.addCommand(['EXEC'], { chainId })
    );

        this._tick();

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

  MULTI(): RedisClientMultiCommandType<[], M, F, S, RESP, FLAGS> {
    return new (this as any).Multi(this);
  }

  multi = this.MULTI;

  async* scanIterator(
    this: RedisClientType<M, F, S, RESP, FLAGS>,
    options?: ScanOptions & ScanIteratorOptions
  ): AsyncIterable<ReplyWithFlags<CommandReply<typeof SCAN, RESP>['keys'], FLAGS>> {
    let cursor = options?.cursor ?? 0;
    do {
      const reply = await this.scan(cursor, options);
      cursor = reply.cursor;
      yield reply.keys;
    } while (cursor !== 0);
  }

  async* hScanIterator(
    this: RedisClientType<M, F, S, RESP, FLAGS>,
    key: RedisArgument,
    options?: ScanCommonOptions & ScanIteratorOptions
  ) {
    let cursor = options?.cursor ?? 0;
    do {
      const reply = await this.hScan(key, cursor, options);
      cursor = reply.cursor;
      yield reply.entries;
    } while (cursor !== 0);
  }

  async* sScanIterator(
    this: RedisClientType<M, F, S, RESP, FLAGS>,
    key: RedisArgument,
    options?: ScanCommonOptions & ScanIteratorOptions
  ) {
    let cursor = options?.cursor ?? 0;
    do {
      const reply = await this.sScan(key, cursor, options);
      cursor = reply.cursor;
      yield reply.members;
    } while (cursor !== 0);
  }

  async* zScanIterator(
    this: RedisClientType<M, F, S, RESP, FLAGS>,
    key: RedisArgument,
    options?: ScanCommonOptions & ScanIteratorOptions
  ) {
    let cursor = options?.cursor ?? 0;
    do {
      const reply = await this.zScan(key, cursor, options);
      cursor = reply.cursor;
      yield reply.members;
    } while (cursor !== 0);
  }

  /**
   * @deprecated use .close instead
   */
  QUIT(): Promise<string> {
    return this._socket.quit(async () => {
      const quitPromise = this._queue.addCommand<string>(['QUIT']);
      this._tick();
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
   * Close the client. Wait for pending replies.
   */
  close() {
    return new Promise<void>(resolve => {
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
