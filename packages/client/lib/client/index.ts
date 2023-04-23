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
import { Pool, Options as PoolOptions, createPool } from 'generic-pool';
import { ReplyWithFlags, BlobStringReply } from '../RESP/types';
import { ScanCommandOptions } from '../commands/SCAN';
import { HScanEntry } from '../commands/HSCAN';
import { ScanOptions, ZMember } from '../commands/generic-transformers';




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
   * TODO
   */
  legacyMode?: boolean;
  /**
   * TODO
   */
  isolationPoolOptions?: PoolOptions;
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
  isolated?: boolean;
}

// type ClientLegacyCallback = (err: Error | null, reply?: RedisCommandRawReply) => void;

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
    return async function (this: ProxyClient) {
      const args = command.transformArguments.apply(undefined, arguments as any),
        reply = await this._sendCommand(args, this.commandOptions);
      return transformReply ?
        transformReply(reply, args.preserve) :
        reply;
    };
  }

  private static _createModuleCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return async function (this: NamespaceProxyClient) {
      const args = command.transformArguments.apply(undefined, arguments as any),
        reply = await this.self._sendCommand(args, this.self.commandOptions);
      return transformReply ?
        transformReply(reply, args.preserve) :
        reply;
    };
  }

  private static _createFunctionCommand(name: string, fn: RedisFunction, resp: RespVersions) {
    const prefix = functionArgumentsPrefix(name, fn),
      transformReply = getTransformReply(fn, resp);
    return async function (this: NamespaceProxyClient) {
      const fnArgs = fn.transformArguments.apply(undefined, arguments as any),
        reply = await this.self._sendCommand(
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
    return async function (this: ProxyClient) {
      const scriptArgs = script.transformArguments.apply(undefined, arguments as any),
        args = prefix.concat(scriptArgs),
        reply = await this._sendCommand(args, this.commandOptions).catch((err: unknown) => {
          if (!(err as Error)?.message?.startsWith?.('NOSCRIPT')) throw err;

          args[0] = 'EVAL';
          args[1] = script.SCRIPT;
          return this._sendCommand(args, this.commandOptions);
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
  >(options?: RedisClientOptions<M, F, S, RESP>) {
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
  private _isolationPool?: Pool<RedisClientType<M, F, S, RESP, FLAGS>>;
  // readonly #v4: Record<string, any> = {};
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

  // get v4(): Record<string, any> {
  //   if (!this.client.#options?.legacyMode) {
  //     throw new Error('the client is not in "legacy mode"');
  //   }

  //   return this.client.#v4;
  // }

  constructor(options?: RedisClientOptions<M, F, S, RESP>) {
    super();
    this._options = this._initiateOptions(options);
    this._queue = this._initiateQueue();
    this._socket = this._initiateSocket();
    // this.#legacyMode();
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
        // promises.push(
        //     this.#queue.addCommand(
        //         COMMANDS.READONLY.transformArguments(),
        //         { asap: true }
        //     )
        // );
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
          // promises.push(
          //     this.#queue.addCommand(
          //         COMMANDS.CLIENT_SETNAME.transformArguments(this.#options.name),
          //         { asap: true }
          //     )
          // );
        }

        if (this._options?.username || this._options?.password) {
          // promises.push(
          //     this.#queue.addCommand(
          //         COMMANDS.AUTH.transformArguments({
          //             username: this.#options.username,
          //             password: this.#options.password ?? ''
          //         }),
          //         { asap: true }
          //     )
          // );
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

  // #legacyMode(): void {
  //   if (!this.#options?.legacyMode) return;

  //   (this as any).#v4.sendCommand = this.#sendCommand.bind(this);
  //   (this as any).sendCommand = (...args: Array<any>): void => {
  //     const result = this.#legacySendCommand(...args);
  //     if (result) {
  //       result.promise
  //         .then(reply => result.callback(null, reply))
  //         .catch(err => result.callback(err));
  //     }
  //   };

  //   for (const [name, command] of Object.entries(COMMANDS)) {
  //     this.#defineLegacyCommand(name, command);
  //     (this as any)[name.toLowerCase()] ??= (this as any)[name];
  //   }

  //   // hard coded commands
  //   this.#defineLegacyCommand('SELECT');
  //   this.#defineLegacyCommand('select');
  //   this.#defineLegacyCommand('SUBSCRIBE');
  //   this.#defineLegacyCommand('subscribe');
  //   this.#defineLegacyCommand('PSUBSCRIBE');
  //   this.#defineLegacyCommand('pSubscribe');
  //   this.#defineLegacyCommand('UNSUBSCRIBE');
  //   this.#defineLegacyCommand('unsubscribe');
  //   this.#defineLegacyCommand('PUNSUBSCRIBE');
  //   this.#defineLegacyCommand('pUnsubscribe');
  //   this.#defineLegacyCommand('QUIT');
  //   this.#defineLegacyCommand('quit');
  // }

  // #legacySendCommand(...args: Array<any>) {
  //   const callback = typeof args[args.length - 1] === 'function' ?
  //     args.pop() as ClientLegacyCallback :
  //     undefined;

  //   const promise = this.#sendCommand(transformLegacyCommandArguments(args));
  //   if (callback) return {
  //     promise,
  //     callback
  //   };
  //   promise.catch(err => this.emit('error', err));
  // }

  // #defineLegacyCommand(name: string, command?: RedisCommand): void {
  //   this.#v4[name] = (this as any)[name].bind(this);
  //   (this as any)[name] = command && command.TRANSFORM_LEGACY_REPLY && command.transformReply ?
  //     (...args: Array<unknown>) => {
  //       const result = this.#legacySendCommand(name, ...args);
  //       if (result) {
  //         result.promise
  //           .then(reply => result.callback(null, command.transformReply!(reply)))
  //           .catch(err => result.callback(err));
  //       }
  //     } :
  //     (...args: Array<unknown>) => (this as any).sendCommand(name, ...args);
  // }

  private _pingTimer?: NodeJS.Timer;

  private _setPingTimer(): void {
    if (!this._options?.pingInterval || !this._socket.isReady) return;
    clearTimeout(this._pingTimer);

    this._pingTimer = setTimeout(() => {
      if (!this._socket.isReady) return;

      // using _sendCommand to support legacy mode
      this._sendCommand(['PING'])
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
    proxy.commandOptions = Object.create((this as ProxyClient).commandOptions ?? null);
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

  /**
   * Override the `asap` command option to `true`
   */
  asap() {
    return this._commandOptionsProxy('asap', true);
  }

  /**
   * Override the `isolated` command option to `true`
   */
  isolated() {
    return this._commandOptionsProxy('isolated', true);
  }

  duplicate(overrides?: Partial<RedisClientOptions<M, F, S, RESP>>) {
    return new (Object.getPrototypeOf(this).constructor)({
      ...this._options,
      ...overrides
    }) as RedisClientType<M, F, S, RESP>;
  }

  async connect(): Promise<void> {
    await this._socket.connect();
    this.self._isolationPool = createPool({
      create: async () => {
        const duplicate = this.duplicate({
          isolationPoolOptions: undefined
        }).on('error', err => this.emit('error', err));
        await duplicate.connect();
        return duplicate;
      },
      destroy: client => client.disconnect()
    }, this._options?.isolationPoolOptions);
  }

  sendCommand = this._sendCommand.bind(this);

  // using `_` to avoid conflicts with the legacy mode
  _sendCommand<T = ReplyUnion>(
    args: CommandArguments,
    options?: ClientCommandOptions
  ): Promise<T> {
    if (!this._socket.isOpen) {
      return Promise.reject(new ClientClosedError());
    } else if (options?.isolated) {
      return this.executeIsolated(isolatedClient =>
        isolatedClient.sendCommand(args, {
          ...options,
          isolated: false
        })
      );
    } else if (!this._socket.isReady && this._options?.disableOfflineQueue) {
      return Promise.reject(new ClientOfflineError());
    }

    const promise = this._queue.addCommand<T>(args, options);
    this._tick();
    return promise;
  }

  async SELECT(db: number): Promise<void> {
    await this._sendCommand(['SELECT', db.toString()]);
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
    console.log('SUBSCRIBE', channels, listener, bufferMode, this._options?.RESP);
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

  unsubscribe = this.UNSUBSCRIBE;

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

  QUIT(): Promise<string> {
    return this._socket.quit(async () => {
      const quitPromise = this._queue.addCommand<string>(['QUIT']);
      this._tick();
      const [reply] = await Promise.all([
        quitPromise,
        this._destroyIsolationPool()
      ]);
      return reply;
    });
  }

  quit = this.QUIT;

  _tick(force = false): void {
    if (this._socket.writableNeedDrain || (!force && !this._socket.isReady)) {
      return;
    }

    this._socket.cork();

    while (!this._socket.writableNeedDrain) {
      const args = this._queue.getCommandToSend();
      if (args === undefined) break;

      this._socket.writeCommand(args);
    }
  }

  executeIsolated<T>(fn: (client: RedisClientType<M, F, S, RESP, FLAGS>) => T | Promise<T>): Promise<T> {
    return this._isolationPool ?
      this._isolationPool.use(fn) :
      Promise.reject(new ClientClosedError());
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

  MULTI(): RedisClientMultiCommandType<[], M, F, S, RESP, FLAGS> {
    return new (this as any).Multi(
      async (
        commands: Array<RedisMultiQueuedCommand>,
        selectedDB?: number,
        chainId?: symbol
      ) => {
        if (!this._socket.isOpen) {
          return Promise.reject(new ClientClosedError());
        }

        const flags = (this as ProxyClient).commandOptions?.flags,
          promise = chainId ?
            // if `chainId` has a value, it's a `MULTI` (and not "pipeline") - need to add the `MULTI` and `EXEC` commands
            Promise.all([
              this._queue.addCommand(['MULTI'], { chainId }),
              this._addMultiCommands(commands, chainId),
              this._queue.addCommand(['EXEC'], { chainId, flags })
            ]) :
            this._addMultiCommands(commands, undefined, flags);

        this._tick();

        const results = await promise;

        if (selectedDB !== undefined) {
          this._selectedDB = selectedDB;
        }

        return results;
      }
      // self.#options?.legacyMode
    );
  }

  multi = this.MULTI;

  async* scanIterator(
    this: RedisClientType<M, F, S, RESP, FLAGS>,
    options?: ScanCommandOptions & ScanIteratorOptions
  ): AsyncIterable<ReplyWithFlags<BlobStringReply, FLAGS>> {
    let cursor = options?.cursor ?? 0;
    do {
      const reply = await this.scan(cursor, options);
      cursor = reply.cursor;
      for (const key of reply.keys) {
        yield key;
      }
    } while (cursor !== 0);
  }

  async* hScanIterator(
    this: RedisClientType<M, F, S, RESP, FLAGS>,
    key: RedisArgument,
    options?: ScanOptions & ScanIteratorOptions
  ): AsyncIterable<ReplyWithFlags<HScanEntry, FLAGS>> {
    let cursor = options?.cursor ?? 0;
    do {
      const reply = await this.hScan(key, cursor, options);
      cursor = reply.cursor;
      for (const entry of reply.entries) {
        yield entry;
      }
    } while (cursor !== 0);
  }

  async* sScanIterator(
    this: RedisClientType<M, F, S, RESP, FLAGS>,
    key: RedisArgument,
    options?: ScanOptions & ScanIteratorOptions
  ): AsyncIterable<ReplyWithFlags<BlobStringReply, FLAGS>> {
    let cursor = options?.cursor ?? 0;
    do {
      const reply = await this.sScan(key, cursor, options);
      cursor = reply.cursor;
      for (const member of reply.members) {
        yield member;
      }
    } while (cursor !== 0);
  }

  async* zScanIterator(
    this: RedisClientType<M, F, S, RESP, FLAGS>,
    key: RedisArgument,
    options?: ScanOptions & ScanIteratorOptions
  ): AsyncIterable<ReplyWithFlags<ZMember, FLAGS>> {
    let cursor = options?.cursor ?? 0;
    do {
      const reply = await this.zScan(key, cursor, options);
      cursor = reply.cursor;
      for (const member of reply.members) {
        yield member;
      }
    } while (cursor !== 0);
  }

  async disconnect(): Promise<void> {
    this._queue.flushAll(new DisconnectsClientError());
    this._socket.disconnect();
    await this._destroyIsolationPool();
  }

  private async _destroyIsolationPool(): Promise<void> {
    await this._isolationPool!.drain();
    await this._isolationPool!.clear();
    this.self._isolationPool = undefined;
  }

  ref(): void {
    this._socket.ref();
  }

  unref(): void {
    this._socket.unref();
  }
}
