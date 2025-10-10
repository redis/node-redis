import COMMANDS from '../commands';
import RedisSocket, { RedisSocketOptions } from './socket';
import { BasicAuth, CredentialsError, CredentialsProvider, StreamingCredentialsProvider, UnableToObtainNewCredentialsError, Disposable } from '../authx';
import RedisCommandsQueue, { CommandOptions } from './commands-queue';
import { EventEmitter } from 'node:events';
import { attachConfig, functionArgumentsPrefix, getTransformReply, scriptArgumentsPrefix } from '../commander';
import { ClientClosedError, ClientOfflineError, DisconnectsClientError, WatchError } from '../errors';
import { URL } from 'node:url';
import { TcpSocketConnectOpts } from 'node:net';
import { PUBSUB_TYPE, PubSubType, PubSubListener, PubSubTypeListeners, ChannelListeners } from './pub-sub';
import { Command, CommandSignature, TypeMapping, CommanderConfig, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts, ReplyUnion, RespVersions, RedisArgument, ReplyWithTypeMapping, SimpleStringReply, TransformReply, CommandArguments } from '../RESP/types';
import RedisClientMultiCommand, { RedisClientMultiCommandType } from './multi-command';
import { MULTI_MODE, MultiMode, RedisMultiQueuedCommand } from '../multi-command';
import HELLO, { HelloOptions } from '../commands/HELLO';
import { ScanOptions, ScanCommonOptions } from '../commands/SCAN';
import { RedisLegacyClient, RedisLegacyClientType } from './legacy-mode';
import { RedisPoolOptions, RedisClientPool } from './pool';
import { RedisVariadicArgument, parseArgs, pushVariadicArguments } from '../commands/generic-transformers';
import { BasicClientSideCache, ClientSideCacheConfig, ClientSideCacheProvider } from './cache';
import { BasicCommandParser, CommandParser } from './parser';
import SingleEntryCache from '../single-entry-cache';
import { version } from '../../package.json'
import EnterpriseMaintenanceManager, { MaintenanceUpdate, MovingEndpointType } from './enterprise-maintenance-manager';

export interface RedisClientOptions<
  M extends RedisModules = RedisModules,
  F extends RedisFunctions = RedisFunctions,
  S extends RedisScripts = RedisScripts,
  RESP extends RespVersions = RespVersions,
  TYPE_MAPPING extends TypeMapping = TypeMapping,
  SocketOptions extends RedisSocketOptions = RedisSocketOptions
> extends CommanderConfig<M, F, S, RESP> {
  /**
   * `redis[s]://[[username][:password]@][host][:port][/db-number]`
   * See [`redis`](https://www.iana.org/assignments/uri-schemes/prov/redis) and [`rediss`](https://www.iana.org/assignments/uri-schemes/prov/rediss) IANA registration for more details
   */
  url?: string;
  /**
   * Socket connection properties
   */
  socket?: SocketOptions;
  /**
   * ACL username ([see ACL guide](https://redis.io/topics/acl))
   */
  username?: string;
  /**
   * ACL password or the old "--requirepass" password
   */
  password?: string;

  /**
   * Provides credentials for authentication. Can be set directly or will be created internally
   * if username/password are provided instead. If both are supplied, this credentialsProvider
   * takes precedence over username/password.
   */
  credentialsProvider?: CredentialsProvider;
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
  /**
   * Default command options to be applied to all commands executed through this client.
   *
   * These options can be overridden on a per-command basis when calling specific commands.
   *
   * @property {symbol} [chainId] - Identifier for chaining commands together
   * @property {boolean} [asap] - When true, the command is executed as soon as possible
   * @property {AbortSignal} [abortSignal] - AbortSignal to cancel the command
   * @property {TypeMapping} [typeMapping] - Custom type mappings between RESP and JavaScript types
   *
   * @example Setting default command options
   * ```
   * const client = createClient({
   *   commandOptions: {
   *     asap: true,
   *     typeMapping: {
   *       // Custom type mapping configuration
   *     }
   *   }
   * });
   * ```
   */
  commandOptions?: CommandOptions<TYPE_MAPPING>;
  /**
   * Client Side Caching configuration.
   *
   * Enables Redis Servers and Clients to work together to cache results from commands
   * sent to a server. The server will notify the client when cached results are no longer valid.
   *
   * Note: Client Side Caching is only supported with RESP3.
   *
   * @example Anonymous cache configuration
   * ```
   * const client = createClient({
   *   RESP: 3,
   *   clientSideCache: {
   *     ttl: 0,
   *     maxEntries: 0,
   *     evictPolicy: "LRU"
   *   }
   * });
   * ```
   *
   * @example Using a controllable cache
   * ```
   * const cache = new BasicClientSideCache({
   *   ttl: 0,
   *   maxEntries: 0,
   *   evictPolicy: "LRU"
   * });
   * const client = createClient({
   *   RESP: 3,
   *   clientSideCache: cache
   * });
   * ```
   */
  clientSideCache?: ClientSideCacheProvider | ClientSideCacheConfig;
  /**
   * If set to true, disables sending client identifier (user-agent like message) to the redis server
   */
  disableClientInfo?: boolean;
  /**
   * Tag to append to library name that is sent to the Redis server
   */
  clientInfoTag?: string;
  /**
   * When set to true, client tracking is turned on and the client emits `invalidate` events when it receives invalidation messages from the redis server.
   * Mutually exclusive with `clientSideCache` option.
   */
  emitInvalidate?: boolean;
  /**
   * Controls how the client handles Redis Enterprise maintenance push notifications.
   *
   * - `disabled`: The feature is not used by the client.
   * - `enabled`: The client attempts to enable the feature on the server. If the server responds with an error, the connection is interrupted.
   * - `auto`: The client attempts to enable the feature on the server. If the server returns an error, the client disables the feature and continues.
   *
   * The default is `auto`.
   */
  maintNotifications?: 'disabled' | 'enabled' | 'auto';
  /**
   * Controls how the client requests the endpoint to reconnect to during a MOVING notification in Redis Enterprise maintenance.
   *
   * - `auto`: If the connection is opened to a name or IP address that is from/resolves to a reserved private IP range, request an internal endpoint (e.g., internal-ip), otherwise an external one. If TLS is enabled, then request a FQDN.
   * - `internal-ip`: Enforce requesting the internal IP.
   * - `internal-fqdn`: Enforce requesting the internal FQDN.
   * - `external-ip`: Enforce requesting the external IP address.
   * - `external-fqdn`: Enforce requesting the external FQDN.
   * - `none`: Used to request a null endpoint, which tells the client to reconnect based on its current config

   * The default is `auto`.
   */
  maintEndpointType?: MovingEndpointType;
  /**
   * Specifies a more relaxed timeout (in milliseconds) for commands during a maintenance window.
   * This helps minimize command timeouts during maintenance. Timeouts during maintenance period result
   * in a `CommandTimeoutDuringMaintenance` error.
   *
   * The default is 10000
   */
  maintRelaxedCommandTimeout?: number;
  /**
   * Specifies a more relaxed timeout (in milliseconds) for the socket during a maintenance window.
   * This helps minimize socket timeouts during maintenance. Timeouts during maintenance period result
   * in a `SocketTimeoutDuringMaintenance` error.
   *
   * The default is 10000
   */
  maintRelaxedSocketTimeout?: number;
};

export type WithCommands<
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
    [P in keyof typeof COMMANDS]: CommandSignature<(typeof COMMANDS)[P], RESP, TYPE_MAPPING>;
  };

export type WithModules<
  M extends RedisModules,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
    [P in keyof M]: {
      [C in keyof M[P]]: CommandSignature<M[P][C], RESP, TYPE_MAPPING>;
    };
  };

export type WithFunctions<
  F extends RedisFunctions,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
    [L in keyof F]: {
      [C in keyof F[L]]: CommandSignature<F[L][C], RESP, TYPE_MAPPING>;
    };
  };

export type WithScripts<
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

type NamespaceProxyClient = { _self: ProxyClient };

interface ScanIteratorOptions {
  cursor?: RedisArgument;
}

export type MonitorCallback<TYPE_MAPPING extends TypeMapping = TypeMapping> = (reply: ReplyWithTypeMapping<SimpleStringReply, TYPE_MAPPING>) => unknown;

export default class RedisClient<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends EventEmitter {
  static #createCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);

    return async function (this: ProxyClient, ...args: Array<unknown>) {
      const parser = new BasicCommandParser();
      command.parseCommand(parser, ...args);

      return this._self._executeCommand(command, parser, this._commandOptions, transformReply);
    }
  }

  static #createModuleCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);

    return async function (this: NamespaceProxyClient, ...args: Array<unknown>) {
      const parser = new BasicCommandParser();
      command.parseCommand(parser, ...args);

      return this._self._executeCommand(command, parser, this._self._commandOptions, transformReply);
    };
  }

  static #createFunctionCommand(name: string, fn: RedisFunction, resp: RespVersions) {
    const prefix = functionArgumentsPrefix(name, fn);
    const transformReply = getTransformReply(fn, resp);

    return async function (this: NamespaceProxyClient, ...args: Array<unknown>) {
      const parser = new BasicCommandParser();
      parser.push(...prefix);
      fn.parseCommand(parser, ...args);

      return this._self._executeCommand(fn, parser, this._self._commandOptions, transformReply);
    };
  }

  static #createScriptCommand(script: RedisScript, resp: RespVersions) {
    const prefix = scriptArgumentsPrefix(script);
    const transformReply = getTransformReply(script, resp);

    return async function (this: ProxyClient, ...args: Array<unknown>) {
      const parser = new BasicCommandParser();
      parser.push(...prefix);
      script.parseCommand(parser, ...args)

      return this._executeScript(script, parser, this._commandOptions, transformReply);
    }
  }

  static #SingleEntryCache = new SingleEntryCache<any, any>()

  static factory<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2
  >(config?: CommanderConfig<M, F, S, RESP>) {


    let Client = RedisClient.#SingleEntryCache.get(config);
    if (!Client) {
      Client = attachConfig({
        BaseClass: RedisClient,
        commands: COMMANDS,
        createCommand: RedisClient.#createCommand,
        createModuleCommand: RedisClient.#createModuleCommand,
        createFunctionCommand: RedisClient.#createFunctionCommand,
        createScriptCommand: RedisClient.#createScriptCommand,
        config
      });

      Client.prototype.Multi = RedisClientMultiCommand.extend(config);

      RedisClient.#SingleEntryCache.set(config, Client);
    }

    return <TYPE_MAPPING extends TypeMapping = {}>(
      options?: Omit<RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>, keyof Exclude<typeof config, undefined>>
    ) => {
      // returning a "proxy" to prevent the namespaces._self to leak between "proxies"
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

  static parseOptions<O extends RedisClientOptions>(options: O): O {
    if (options?.url) {
      const parsed = RedisClient.parseURL(options.url);
      if (options.socket) {
        if (options.socket.tls !== undefined && options.socket.tls !== parsed.socket.tls) {
          throw new TypeError(`tls socket option is set to ${options.socket.tls} which is mismatch with protocol or the URL ${options.url} passed`)
        }
        parsed.socket = Object.assign(options.socket, parsed.socket);
      }

      Object.assign(options, parsed);
    }
    return options;
  }

  static parseURL(url: string): RedisClientOptions & {
    socket: Exclude<RedisClientOptions['socket'], undefined> & {
      tls: boolean
    }
  } {
    // https://www.iana.org/assignments/uri-schemes/prov/redis
    const { hostname, port, protocol, username, password, pathname } = new URL(url),
      parsed: RedisClientOptions & {
        socket: Exclude<RedisClientOptions['socket'], undefined> & {
          tls: boolean
        }
      } = {
        socket: {
          host: hostname,
          tls: false
        }
      };

    if (protocol !== 'redis:' && protocol !== 'rediss:') {
      throw new TypeError('Invalid protocol');
    }

    parsed.socket.tls = protocol === 'rediss:';

    if (port) {
      (parsed.socket as TcpSocketConnectOpts).port = Number(port);
    }

    if (username) {
      parsed.username = decodeURIComponent(username);
    }

    if (password) {
      parsed.password = decodeURIComponent(password);
    }

    if (username || password) {
      parsed.credentialsProvider = {
        type: 'async-credentials-provider',
        credentials: async () => (
          {
            username: username ? decodeURIComponent(username) : undefined,
            password: password ? decodeURIComponent(password) : undefined
          })
      };
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

  readonly #options: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>;
  #socket: RedisSocket;
  readonly #queue: RedisCommandsQueue;
  #selectedDB = 0;
  #monitorCallback?: MonitorCallback<TYPE_MAPPING>;
  private _self = this;
  private _commandOptions?: CommandOptions<TYPE_MAPPING>;
  // flag used to annotate that the client
  // was in a watch transaction when
  // a topology change occured
  #dirtyWatch?: string;
  #watchEpoch?: number;
  #clientSideCache?: ClientSideCacheProvider;
  #credentialsSubscription: Disposable | null = null;
  // Flag used to pause writing to the socket during maintenance windows.
  // When true, prevents new commands from being written while waiting for:
  // 1. New socket to be ready after maintenance redirect
  // 2. In-flight commands on the old socket to complete
  #paused = false;

  get clientSideCache() {
    return this._self.#clientSideCache;
  }

  get options(): RedisClientOptions<M, F, S, RESP> {
    return this._self.#options;
  }

  get isOpen(): boolean {
    return this._self.#socket.isOpen;
  }

  get isReady(): boolean {
    return this._self.#socket.isReady;
  }

  get isPubSubActive() {
    return this._self.#queue.isPubSubActive;
  }

  get socketEpoch() {
    return this._self.#socket.socketEpoch;
  }

  get isWatching() {
    return this._self.#watchEpoch !== undefined;
  }

  /**
   * Indicates whether the client's WATCH command has been invalidated by a topology change.
   * When this returns true, any transaction using WATCH will fail with a WatchError.
   * @returns true if the watched keys have been modified, false otherwise
   */
  get isDirtyWatch(): boolean {
    return this._self.#dirtyWatch !== undefined
  }

  /**
   * Marks the client's WATCH command as invalidated due to a topology change.
   * This will cause any subsequent EXEC in a transaction to fail with a WatchError.
   * @param msg - The error message explaining why the WATCH is dirty
   */
  setDirtyWatch(msg: string) {
    this._self.#dirtyWatch = msg;
  }

  constructor(options?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>) {
    super();
    this.#validateOptions(options)
    this.#options = this.#initiateOptions(options);
    this.#queue = this.#initiateQueue();
    this.#socket = this.#initiateSocket();


    if(this.#options.maintNotifications !== 'disabled') {
      new EnterpriseMaintenanceManager(this.#queue, this, this.#options);
    };

    if (this.#options.clientSideCache) {
      if (this.#options.clientSideCache instanceof ClientSideCacheProvider) {
        this.#clientSideCache = this.#options.clientSideCache;
      } else {
        const cscConfig = this.#options.clientSideCache;
        this.#clientSideCache = new BasicClientSideCache(cscConfig);
      }
      this.#queue.addPushHandler((push: Array<any>): boolean => {
        if (push[0].toString() !== 'invalidate') return false;

        if (push[1] !== null) {
          for (const key of push[1]) {
            this.#clientSideCache?.invalidate(key)
          }
        } else {
          this.#clientSideCache?.invalidate(null)
        }

        return true
      });
    } else if (options?.emitInvalidate) {
      this.#queue.addPushHandler((push: Array<any>): boolean => {
        if (push[0].toString() !== 'invalidate') return false;

        if (push[1] !== null) {
          for (const key of push[1]) {
            this.emit('invalidate', key);
          }
        } else {
          this.emit('invalidate', null);
        }
        return true
      });
    }
  }

  #validateOptions(options?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>) {
    if (options?.clientSideCache && options?.RESP !== 3) {
      throw new Error('Client Side Caching is only supported with RESP3');
    }
    if (options?.emitInvalidate && options?.RESP !== 3) {
      throw new Error('emitInvalidate is only supported with RESP3');
    }
    if (options?.clientSideCache && options?.emitInvalidate) {
      throw new Error('emitInvalidate is not supported (or necessary) when clientSideCache is enabled');
    }
    if (options?.maintNotifications && options?.maintNotifications !== 'disabled' && options?.RESP !== 3) {
      throw new Error('Graceful Maintenance is only supported with RESP3');
    }
  }

  #initiateOptions(options: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING> = {}): RedisClientOptions<M, F, S, RESP, TYPE_MAPPING> {

    // Convert username/password to credentialsProvider if no credentialsProvider is already in place
    if (!options.credentialsProvider && (options.username || options.password)) {

      options.credentialsProvider = {
        type: 'async-credentials-provider',
        credentials: async () => ({
          username: options.username,
          password: options.password
        })
      };
    }

    if (options.database) {
      this._self.#selectedDB = options.database;
    }

    if (options.commandOptions) {
      this._commandOptions = options.commandOptions;
    }

    if(options.maintNotifications !== 'disabled') {
      EnterpriseMaintenanceManager.setupDefaultMaintOptions(options);
    }

    if (options.url) {
      const parsedOptions = RedisClient.parseOptions(options);
      if (parsedOptions?.database) {
        this._self.#selectedDB = parsedOptions.database;
      }
      return parsedOptions;
    }

    return options;
  }

  #initiateQueue(): RedisCommandsQueue {
    return new RedisCommandsQueue(
      this.#options.RESP ?? 2,
      this.#options.commandsQueueMaxLength,
      (channel, listeners) => this.emit('sharded-channel-moved', channel, listeners)
    );
  }

  /**
   * @param credentials
   */
  private reAuthenticate = async (credentials: BasicAuth) => {
    // Re-authentication is not supported on RESP2 with PubSub active
    if (!(this.isPubSubActive && !this.#options.RESP)) {
      await this.sendCommand(
        parseArgs(COMMANDS.AUTH, {
          username: credentials.username,
          password: credentials.password ?? ''
        })
      );
    }
  }

  #subscribeForStreamingCredentials(cp: StreamingCredentialsProvider): Promise<[BasicAuth, Disposable]> {
    return cp.subscribe({
      onNext: credentials => {
        this.reAuthenticate(credentials).catch(error => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          cp.onReAuthenticationError(new CredentialsError(errorMessage));
        });

      },
      onError: (e: Error) => {
        const errorMessage = `Error from streaming credentials provider: ${e.message}`;
        cp.onReAuthenticationError(new UnableToObtainNewCredentialsError(errorMessage));
      }
    });
  }

  async #handshake(chainId: symbol, asap: boolean) {
    const promises = [];
    const commandsWithErrorHandlers = await this.#getHandshakeCommands();

    if (asap) commandsWithErrorHandlers.reverse()

    for (const { cmd, errorHandler } of commandsWithErrorHandlers) {
      promises.push(
        this.#queue
          .addCommand(cmd, {
            chainId,
            asap
          })
          .catch(errorHandler)
      );
    }
    return promises;
  }

  async #getHandshakeCommands(): Promise<
    Array<{ cmd: CommandArguments } & { errorHandler?: (err: Error) => void }>
  > {
    const commands = [];
    const cp = this.#options.credentialsProvider;

    if (this.#options.RESP) {
      const hello: HelloOptions = {};

      if (cp && cp.type === 'async-credentials-provider') {
        const credentials = await cp.credentials();
        if (credentials.password) {
          hello.AUTH = {
            username: credentials.username ?? 'default',
            password: credentials.password
          };
        }
      }

      if (cp && cp.type === 'streaming-credentials-provider') {
        const [credentials, disposable] =
          await this.#subscribeForStreamingCredentials(cp);
        this.#credentialsSubscription = disposable;

        if (credentials.password) {
          hello.AUTH = {
            username: credentials.username ?? 'default',
            password: credentials.password
          };
        }
      }

      if (this.#options.name) {
        hello.SETNAME = this.#options.name;
      }

      commands.push({ cmd: parseArgs(HELLO, this.#options.RESP, hello) });
    } else {
      if (cp && cp.type === 'async-credentials-provider') {
        const credentials = await cp.credentials();

        if (credentials.username || credentials.password) {
          commands.push({
            cmd: parseArgs(COMMANDS.AUTH, {
              username: credentials.username,
              password: credentials.password ?? ''
            })
          });
        }
      }

      if (cp && cp.type === 'streaming-credentials-provider') {
        const [credentials, disposable] =
          await this.#subscribeForStreamingCredentials(cp);
        this.#credentialsSubscription = disposable;

        if (credentials.username || credentials.password) {
          commands.push({
            cmd: parseArgs(COMMANDS.AUTH, {
              username: credentials.username,
              password: credentials.password ?? ''
            })
          });
        }
      }

      if (this.#options.name) {
        commands.push({
          cmd: parseArgs(COMMANDS.CLIENT_SETNAME, this.#options.name)
        });
      }
    }

    if (this.#selectedDB !== 0) {
      commands.push({ cmd: ['SELECT', this.#selectedDB.toString()] });
    }

    if (this.#options.readonly) {
      commands.push({ cmd: parseArgs(COMMANDS.READONLY) });
    }

    if (!this.#options.disableClientInfo) {
      commands.push({
        cmd: ['CLIENT', 'SETINFO', 'LIB-VER', version],
        errorHandler: () => {
          // Client libraries are expected to pipeline this command
          // after authentication on all connections and ignore failures
          // since they could be connected to an older version that doesn't support them.
        }
      });

      commands.push({
        cmd: [
          'CLIENT',
          'SETINFO',
          'LIB-NAME',
          this.#options.clientInfoTag
            ? `node-redis(${this.#options.clientInfoTag})`
            : 'node-redis'
        ],
        errorHandler: () => {
          // Client libraries are expected to pipeline this command
          // after authentication on all connections and ignore failures
          // since they could be connected to an older version that doesn't support them.
        }
      });
    }

    if (this.#clientSideCache) {
      commands.push({cmd: this.#clientSideCache.trackingOn()});
    }

    if (this.#options?.emitInvalidate) {
      commands.push({cmd: ['CLIENT', 'TRACKING', 'ON']});
    }

    const maintenanceHandshakeCmd = await EnterpriseMaintenanceManager.getHandshakeCommand(this.#options);

    if(maintenanceHandshakeCmd) {
      commands.push(maintenanceHandshakeCmd);
    };

    return commands;
  }

  #attachListeners(socket: RedisSocket) {
    socket.on('data', chunk => {
      try {
        this.#queue.decoder.write(chunk);
      } catch (err) {
        this.#queue.resetDecoder();
        this.emit('error', err);
      }
    })
    .on('error', err => {
      this.emit('error', err);
      this.#clientSideCache?.onError();
      if (this.#socket.isOpen && !this.#options.disableOfflineQueue) {
        this.#queue.flushWaitingForReply(err);
      } else {
        this.#queue.flushAll(err);
      }
    })
    .on('connect', () => this.emit('connect'))
    .on('ready', () => {
      this.emit('ready');
      this.#setPingTimer();
      this.#maybeScheduleWrite();
    })
    .on('reconnecting', () => this.emit('reconnecting'))
    .on('drain', () => this.#maybeScheduleWrite())
    .on('end', () => this.emit('end'));
  }

  #initiateSocket(): RedisSocket {
    const socketInitiator = async () => {
      const promises = [],
        chainId = Symbol('Socket Initiator');

      const resubscribePromise = this.#queue.resubscribe(chainId);
      resubscribePromise?.catch(error => {
        if (error.message && error.message.startsWith('MOVED')) {
          this.emit('__MOVED', this._self.#queue.removeAllPubSubListeners());
        }
      });
      if (resubscribePromise) {
        promises.push(resubscribePromise);
      }

      if (this.#monitorCallback) {
        promises.push(
          this.#queue.monitor(
            this.#monitorCallback,
            {
              typeMapping: this._commandOptions?.typeMapping,
              chainId,
              asap: true
            }
          )
        );
      }

      promises.push(...(await this.#handshake(chainId, true)));

      if (promises.length) {
        this.#write();
        return Promise.all(promises);
      }
    };

    const socket = new RedisSocket(socketInitiator, this.#options.socket);
    this.#attachListeners(socket);
    return socket;
  }

  #pingTimer?: NodeJS.Timeout;

  #setPingTimer(): void {
    if (!this.#options.pingInterval || !this.#socket.isReady) return;
    clearTimeout(this.#pingTimer);

    this.#pingTimer = setTimeout(() => {
      if (!this.#socket.isReady) return;

      this.sendCommand(['PING'])
        .then(reply => this.emit('ping-interval', reply))
        .catch(err => this.emit('error', err))
        .finally(() => this.#setPingTimer());
    }, this.#options.pingInterval);
  }

  withCommandOptions<
    OPTIONS extends CommandOptions<TYPE_MAPPING>,
    TYPE_MAPPING extends TypeMapping
  >(options: OPTIONS) {
    const proxy = Object.create(this._self);
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
    const proxy = Object.create(this._self);
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
  createPool(options?: Partial<RedisPoolOptions>) {
    return RedisClientPool.create(
      this._self.#options,
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
      ...this._self.#options,
      commandOptions: this._commandOptions,
      ...overrides
    }) as RedisClientType<_M, _F, _S, _RESP, _TYPE_MAPPING>;
  }

  async connect() {
    await this._self.#socket.connect();
    return this as unknown as RedisClientType<M, F, S, RESP, TYPE_MAPPING>;
  }

  /**
   * @internal
   */
   _ejectSocket(): RedisSocket {
     const socket = this._self.#socket;
     // @ts-ignore
     this._self.#socket = null;
     socket.removeAllListeners();
     return socket;
   }

   /**
    * @internal
    */
   _insertSocket(socket: RedisSocket) {
     if(this._self.#socket) {
      this._self._ejectSocket().destroy();
     }
     this._self.#socket = socket;
     this._self.#attachListeners(this._self.#socket);
   }

   /**
    * @internal
    */
   _maintenanceUpdate(update: MaintenanceUpdate) {
     this._self.#socket.setMaintenanceTimeout(update.relaxedSocketTimeout);
     this._self.#queue.setMaintenanceCommandTimeout(update.relaxedCommandTimeout);
   }

   /**
    * @internal
    */
   _pause() {
     this._self.#paused = true;
   }

   /**
    * @internal
    */
   _unpause() {
     this._self.#paused = false;
     this._self.#maybeScheduleWrite();
   }

  /**
   * @internal
   */
  async _executeCommand(
    command: Command,
    parser: CommandParser,
    commandOptions: CommandOptions<TYPE_MAPPING> | undefined,
    transformReply: TransformReply | undefined,
  ) {
    const csc = this._self.#clientSideCache;
    const defaultTypeMapping = this._self.#options.commandOptions === commandOptions;

    const fn = () => { return this.sendCommand(parser.redisArgs, commandOptions) };

    if (csc && command.CACHEABLE && defaultTypeMapping) {
      return await csc.handleCache(this._self, parser as BasicCommandParser, fn, transformReply, commandOptions?.typeMapping);
    } else {
      const reply = await fn();

      if (transformReply) {
        return transformReply(reply, parser.preserve, commandOptions?.typeMapping);
      }
      return reply;
    }
  }

  /**
   * @internal
   */
  async _executeScript(
    script: RedisScript,
    parser: CommandParser,
    options: CommandOptions | undefined,
    transformReply: TransformReply | undefined,
  ) {
    const args = parser.redisArgs as Array<RedisArgument>;

    let reply: ReplyUnion;
    try {
      reply = await this.sendCommand(args, options);
    } catch (err) {
      if (!(err as Error)?.message?.startsWith?.('NOSCRIPT')) throw err;

      args[0] = 'EVAL';
      args[1] = script.SCRIPT;
      reply = await this.sendCommand(args, options);
    }

    return transformReply ?
      transformReply(reply, parser.preserve, options?.typeMapping) :
      reply;
  }

  sendCommand<T = ReplyUnion>(
    args: ReadonlyArray<RedisArgument>,
    options?: CommandOptions
  ): Promise<T> {
    if (!this._self.#socket.isOpen) {
      return Promise.reject(new ClientClosedError());
    } else if (!this._self.#socket.isReady && this._self.#options.disableOfflineQueue) {
      return Promise.reject(new ClientOfflineError());
    }

    // Merge global options with provided options
    const opts = {
      ...this._self._commandOptions,
      ...options
    }

    const promise = this._self.#queue.addCommand<T>(args, opts);
    this._self.#scheduleWrite();
    return promise;
  }

  async SELECT(db: number): Promise<void> {
    await this.sendCommand(['SELECT', db.toString()]);
    this._self.#selectedDB = db;
  }

  select = this.SELECT;

  #pubSubCommand<T>(promise: Promise<T> | undefined) {
    if (promise === undefined) return Promise.resolve();

    this.#scheduleWrite();
    return promise;
  }

  SUBSCRIBE<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ): Promise<void> {
    return this._self.#pubSubCommand(
      this._self.#queue.subscribe(
        PUBSUB_TYPE.CHANNELS,
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
    return this._self.#pubSubCommand(
      this._self.#queue.unsubscribe(
        PUBSUB_TYPE.CHANNELS,
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
    return this._self.#pubSubCommand(
      this._self.#queue.subscribe(
        PUBSUB_TYPE.PATTERNS,
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
    return this._self.#pubSubCommand(
      this._self.#queue.unsubscribe(
        PUBSUB_TYPE.PATTERNS,
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
    return this._self.#pubSubCommand(
      this._self.#queue.subscribe(
        PUBSUB_TYPE.SHARDED,
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
    return this._self.#pubSubCommand(
      this._self.#queue.unsubscribe(
        PUBSUB_TYPE.SHARDED,
        channels,
        listener,
        bufferMode
      )
    );
  }

  sUnsubscribe = this.SUNSUBSCRIBE;

  async WATCH(key: RedisVariadicArgument) {
    const reply = await this._self.sendCommand(
      pushVariadicArguments(['WATCH'], key)
    );
    this._self.#watchEpoch ??= this._self.socketEpoch;
    return reply as unknown as ReplyWithTypeMapping<SimpleStringReply<'OK'>, TYPE_MAPPING>;
  }

  watch = this.WATCH;

  async UNWATCH() {
    const reply = await this._self.sendCommand(['UNWATCH']);
    this._self.#watchEpoch = undefined;
    return reply as unknown as ReplyWithTypeMapping<SimpleStringReply<'OK'>, TYPE_MAPPING>;
  }

  unwatch = this.UNWATCH;

  getPubSubListeners(type: PubSubType) {
    return this._self.#queue.getPubSubListeners(type);
  }

  extendPubSubChannelListeners(
    type: PubSubType,
    channel: string,
    listeners: ChannelListeners
  ) {
    return this._self.#pubSubCommand(
      this._self.#queue.extendPubSubChannelListeners(type, channel, listeners)
    );
  }

  extendPubSubListeners(type: PubSubType, listeners: PubSubTypeListeners) {
    return this._self.#pubSubCommand(
      this._self.#queue.extendPubSubListeners(type, listeners)
    );
  }

  #write() {
    if(this.#paused) {
      return
    }
    this.#socket.write(this.#queue.commandsToWrite());
  }

  #scheduledWrite?: NodeJS.Immediate;

  #scheduleWrite() {
    if (!this.#socket.isReady || this.#scheduledWrite) return;

    this.#scheduledWrite = setImmediate(() => {
      this.#write();
      this.#scheduledWrite = undefined;
    });
  }

  #maybeScheduleWrite() {
    if (!this.#queue.isWaitingToWrite()) return;

    this.#scheduleWrite();
  }

  /**
   * @internal
   */
  async _executePipeline(
    commands: Array<RedisMultiQueuedCommand>,
    selectedDB?: number
  ) {
    if (!this._self.#socket.isOpen) {
      return Promise.reject(new ClientClosedError());
    }

    const chainId = Symbol('Pipeline Chain'),
      promise = Promise.all(
        commands.map(({ args }) => this._self.#queue.addCommand(args, {
          chainId,
          typeMapping: this._commandOptions?.typeMapping
        }))
      );
    this._self.#scheduleWrite();
    const result = await promise;

    if (selectedDB !== undefined) {
      this._self.#selectedDB = selectedDB;
    }

    return result;
  }

  /**
   * @internal
   */
  async _executeMulti(
    commands: Array<RedisMultiQueuedCommand>,
    selectedDB?: number
  ) {
    const dirtyWatch = this._self.#dirtyWatch;
    this._self.#dirtyWatch = undefined;
    const watchEpoch = this._self.#watchEpoch;
    this._self.#watchEpoch = undefined;

    if (!this._self.#socket.isOpen) {
      throw new ClientClosedError();
    }

    if (dirtyWatch) {
      throw new WatchError(dirtyWatch);
    }

    if (watchEpoch && watchEpoch !== this._self.socketEpoch) {
      throw new WatchError('Client reconnected after WATCH');
    }

    const typeMapping = this._commandOptions?.typeMapping;
    const chainId = Symbol('MULTI Chain');
    const promises = [
      this._self.#queue.addCommand(['MULTI'], { chainId }),
    ];

    for (const { args } of commands) {
      promises.push(
        this._self.#queue.addCommand(args, {
          chainId,
          typeMapping
        })
      );
    }

    promises.push(
      this._self.#queue.addCommand(['EXEC'], { chainId })
    );

    this._self.#scheduleWrite();

    const results = await Promise.all(promises),
      execResult = results[results.length - 1];

    if (execResult === null) {
      throw new WatchError();
    }

    if (selectedDB !== undefined) {
      this._self.#selectedDB = selectedDB;
    }

    return execResult as Array<unknown>;
  }

  MULTI<isTyped extends MultiMode = MULTI_MODE['TYPED']>() {
    type Multi = new (...args: ConstructorParameters<typeof RedisClientMultiCommand>) => RedisClientMultiCommandType<isTyped, [], M, F, S, RESP, TYPE_MAPPING>;
    return new ((this as any).Multi as Multi)(
      this._executeMulti.bind(this),
      this._executePipeline.bind(this),
      this._commandOptions?.typeMapping
    );
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

  async* hScanValuesIterator(
    this: RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
    key: RedisArgument,
    options?: ScanCommonOptions & ScanIteratorOptions
  ) {
    let cursor = options?.cursor ?? '0';
    do {
      const reply = await this.hScanNoValues(key, cursor, options);
      cursor = reply.cursor;
      yield reply.fields;
    } while (cursor !== '0');
  }

  async* hScanNoValuesIterator(
    this: RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
    key: RedisArgument,
    options?: ScanCommonOptions & ScanIteratorOptions
  ) {
    let cursor = options?.cursor ?? '0';
    do {
      const reply = await this.hScanNoValues(key, cursor, options);
      cursor = reply.cursor;
      yield reply.fields;
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

  async MONITOR(callback: MonitorCallback<TYPE_MAPPING>) {
    const promise = this._self.#queue.monitor(callback, {
      typeMapping: this._commandOptions?.typeMapping
    });
    this._self.#scheduleWrite();
    await promise;
    this._self.#monitorCallback = callback;
  }

  monitor = this.MONITOR;

  /**
   * Reset the client to its default state (i.e. stop PubSub, stop monitoring, select default DB, etc.)
   */
  async reset() {
    const chainId = Symbol('Reset Chain'),
      promises = [this._self.#queue.reset(chainId)],
      selectedDB = this._self.#options?.database ?? 0;
    this._self.#credentialsSubscription?.dispose();
    this._self.#credentialsSubscription = null;
    promises.push(...(await this._self.#handshake(chainId, false)));
    this._self.#scheduleWrite();
    await Promise.all(promises);
    this._self.#selectedDB = selectedDB;
    this._self.#monitorCallback = undefined;
    this._self.#dirtyWatch = undefined;
    this._self.#watchEpoch = undefined;
  }

  /**
   * If the client has state, reset it.
   * An internal function to be used by wrapper class such as `RedisClientPool`.
   * @internal
   */
  resetIfDirty() {
    let shouldReset = false;
    if (this._self.#selectedDB !== (this._self.#options?.database ?? 0)) {
      console.warn('Returning a client with a different selected DB');
      shouldReset = true;
    }

    if (this._self.#monitorCallback) {
      console.warn('Returning a client with active MONITOR');
      shouldReset = true;
    }

    if (this._self.#queue.isPubSubActive) {
      console.warn('Returning a client with active PubSub');
      shouldReset = true;
    }

    if (this._self.#dirtyWatch || this._self.#watchEpoch) {
      console.warn('Returning a client with active WATCH');
      shouldReset = true;
    }

    if (shouldReset) {
      return this.reset();
    }
  }

  /**
   * @deprecated use .close instead
   */
  QUIT(): Promise<string> {
    this._self.#credentialsSubscription?.dispose();
    this._self.#credentialsSubscription = null;
    return this._self.#socket.quit(async () => {
      clearTimeout(this._self.#pingTimer);
      const quitPromise = this._self.#queue.addCommand<string>(['QUIT']);
      this._self.#scheduleWrite();
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
      clearTimeout(this._self.#pingTimer);
      this._self.#socket.close();
      this._self.#clientSideCache?.onClose();

      if (this._self.#queue.isEmpty()) {
        this._self.#socket.destroySocket();
        return resolve();
      }

      const maybeClose = () => {
        if (!this._self.#queue.isEmpty()) return;

        this._self.#socket.off('data', maybeClose);
        this._self.#socket.destroySocket();
        resolve();
      };
      this._self.#socket.on('data', maybeClose);
      this._self.#credentialsSubscription?.dispose();
      this._self.#credentialsSubscription = null;
    });
  }

  /**
   * Destroy the client. Rejects all commands immediately.
   */
  destroy() {
    clearTimeout(this._self.#pingTimer);
    this._self.#queue.flushAll(new DisconnectsClientError());
    this._self.#socket.destroy();
    this._self.#clientSideCache?.onClose();
    this._self.#credentialsSubscription?.dispose();
    this._self.#credentialsSubscription = null;
  }

  ref() {
    this._self.#socket.ref();
  }

  unref() {
    this._self.#socket.unref();
  }
}
