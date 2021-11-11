import COMMANDS from './commands';
import { RedisCommand, RedisCommandArguments, RedisCommandRawReply, RedisCommandReply, RedisModules, RedisPlugins, RedisScript, RedisScripts } from '../commands';
import RedisSocket, { RedisSocketOptions, RedisNetSocketOptions, RedisTlsSocketOptions } from './socket';
import RedisCommandsQueue, { PubSubListener, PubSubSubscribeCommands, PubSubUnsubscribeCommands, QueueCommandOptions } from './commands-queue';
import RedisClientMultiCommand, { RedisClientMultiCommandType } from './multi-command';
import { RedisMultiQueuedCommand } from '../multi-command';
import EventEmitter from 'events';
import { CommandOptions, commandOptions, isCommandOptions } from '../command-options';
import { ScanOptions, ZMember } from '../commands/generic-transformers';
import { ScanCommandOptions } from '../commands/SCAN';
import { HScanTuple } from '../commands/HSCAN';
import { extendWithCommands, extendWithModulesAndScripts, LegacyCommandArguments, transformCommandArguments, transformCommandReply, transformLegacyCommandArguments } from '../commander';
import { Pool, Options as PoolOptions, createPool } from 'generic-pool';
import { ClientClosedError, DisconnectsClientError } from '../errors';
import { URL } from 'url';

export interface RedisClientOptions<M extends RedisModules, S extends RedisScripts> extends RedisPlugins<M, S> {
    url?: string;
    socket?: RedisSocketOptions;
    username?: string;
    password?: string;
    database?: number;
    commandsQueueMaxLength?: number;
    readonly?: boolean;
    legacyMode?: boolean;
    isolationPoolOptions?: PoolOptions;
}

export type RedisClientCommandSignature<C extends RedisCommand> =
    (...args: Parameters<C['transformArguments']> | [options: CommandOptions<ClientCommandOptions>, ...rest: Parameters<C['transformArguments']>]) => Promise<RedisCommandReply<C>>;

type WithCommands = {
    [P in keyof typeof COMMANDS]: RedisClientCommandSignature<(typeof COMMANDS)[P]>;
};

export type WithModules<M extends RedisModules> = {
    [P in keyof M as M[P] extends never ? never : P]: {
        [C in keyof M[P]]: RedisClientCommandSignature<M[P][C]>;
    };
};

export type WithScripts<S extends RedisScripts> = {
    [P in keyof S as S[P] extends never ? never : P]: RedisClientCommandSignature<S[P]>;
};

export type RedisClientType<M extends RedisModules = Record<string, never>, S extends RedisScripts = Record<string, never>> =
    RedisClient<M, S> & WithCommands & WithModules<M> & WithScripts<S>;

export type InstantiableRedisClient<M extends RedisModules, S extends RedisScripts> =
    new (...args: ConstructorParameters<typeof RedisClient>) => RedisClientType<M, S>;

export interface ClientCommandOptions extends QueueCommandOptions {
    isolated?: boolean;
}

type ClientLegacyCallback = (err: Error | null, reply?: RedisCommandRawReply) => void;

export type ClientLegacyCommandArguments = LegacyCommandArguments | [...LegacyCommandArguments, ClientLegacyCallback];
export default class RedisClient<M extends RedisModules, S extends RedisScripts> extends EventEmitter {
    static commandOptions(options: ClientCommandOptions): CommandOptions<ClientCommandOptions> {
        return commandOptions(options);
    }

    static extend<M extends RedisModules = Record<string, never>, S extends RedisScripts = Record<string, never>>(plugins?: RedisPlugins<M, S>): InstantiableRedisClient<M, S> {
        const Client = <any>extendWithModulesAndScripts({
            BaseClass: RedisClient,
            modules: plugins?.modules,
            modulesCommandsExecutor: RedisClient.prototype.commandsExecutor,
            scripts: plugins?.scripts,
            scriptsExecutor: RedisClient.prototype.scriptsExecutor
        });

        if (Client !== RedisClient) {
            Client.prototype.Multi = RedisClientMultiCommand.extend(plugins);
        }

        return Client;
    }

    static create<M extends RedisModules = Record<string, never>, S extends RedisScripts = Record<string, never>>(options?: RedisClientOptions<M, S>): RedisClientType<M, S> {
        return new (RedisClient.extend(options))(options);
    }

    static parseURL(url: string): RedisClientOptions<Record<string, never>, Record<string, never>> {
        // https://www.iana.org/assignments/uri-schemes/prov/redis
        const { hostname, port, protocol, username, password, pathname } = new URL(url),
            parsed: RedisClientOptions<Record<string, never>, Record<string, never>> = {
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
            (parsed.socket as RedisNetSocketOptions).port = Number(port);
        }

        if (username) {
            parsed.username = username;
        }

        if (password) {
            parsed.password = password;
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

    readonly #options?: RedisClientOptions<M, S>;
    readonly #socket: RedisSocket;
    readonly #queue: RedisCommandsQueue;
    readonly #isolationPool: Pool<RedisClientType<M, S>>;
    readonly #v4: Record<string, any> = {};
    #selectedDB = 0;

    get options(): RedisClientOptions<M, S> | undefined {
        return this.#options;
    }

    get isOpen(): boolean {
        return this.#socket.isOpen;
    }

    get v4(): Record<string, any> {
        if (!this.#options?.legacyMode) {
            throw new Error('the client is not in "legacy mode"');
        }

        return this.#v4;
    }

    constructor(options?: RedisClientOptions<M, S>) {
        super();
        this.#options = this.#initiateOptions(options);
        this.#socket = this.#initiateSocket();
        this.#queue = this.#initiateQueue();
        this.#isolationPool = createPool({
            create: async () => {
                const duplicate = this.duplicate({
                    isolationPoolOptions: undefined
                });
                await duplicate.connect();
                return duplicate;
            },
            destroy: client => client.disconnect()
        }, options?.isolationPoolOptions);
        this.#legacyMode();
    }

    #initiateOptions(options?: RedisClientOptions<M, S>): RedisClientOptions<M, S> | undefined {
        if (options?.url) {
            const parsed = RedisClient.parseURL(options.url);
            if (options.socket) {
                parsed.socket = Object.assign(options.socket, parsed.socket);
            }

            Object.assign(options, parsed);
        }

        if (options?.database) {
            this.#selectedDB = options.database;
        }

        return options;
    }

    #initiateSocket(): RedisSocket {
        const socketInitiator = async (): Promise<void> => {
            const promises = [];

            if (this.#selectedDB !== 0) {
                promises.push(
                    this.#queue.addCommand(
                        ['SELECT', this.#selectedDB.toString()],
                        { asap: true }
                    )
                );
            }

            if (this.#options?.readonly) {
                promises.push(
                    this.#queue.addCommand(
                        COMMANDS.READONLY.transformArguments(),
                        { asap: true }
                    )
                );
            }

            if (this.#options?.username || this.#options?.password) {
                promises.push(
                    this.#queue.addCommand(
                        COMMANDS.AUTH.transformArguments({
                            username: this.#options.username,
                            password: this.#options.password ?? ''
                        }),
                        { asap: true }
                    )
                );
            }

            const resubscribePromise = this.#queue.resubscribe();
            if (resubscribePromise) {
                promises.push(resubscribePromise);
            }

            if (promises.length) {
                this.#tick(true);
                await Promise.all(promises);
            }
        };

        return new RedisSocket(socketInitiator, this.#options?.socket)
            .on('data', data => this.#queue.parseResponse(data))
            .on('error', err => {
                this.emit('error', err);
                this.#queue.flushWaitingForReply(err);
            })
            .on('connect', () => this.emit('connect'))
            .on('ready', () => {
                this.emit('ready');
                this.#tick();
            })
            .on('reconnecting', () => this.emit('reconnecting'))
            .on('drain', () => this.#tick())
            .on('end', () => this.emit('end'));
    }

    #initiateQueue(): RedisCommandsQueue {
        return new RedisCommandsQueue(this.#options?.commandsQueueMaxLength);
    }

    #legacyMode(): void {
        if (!this.#options?.legacyMode) return;

        (this as any).#v4.sendCommand = this.#sendCommand.bind(this);
        (this as any).sendCommand = (...args: ClientLegacyCommandArguments): void => {
            let callback: ClientLegacyCallback;
            if (typeof args[args.length - 1] === 'function') {
                callback = args.pop() as ClientLegacyCallback;
            }

            this.#sendCommand(transformLegacyCommandArguments(args as LegacyCommandArguments))
                .then((reply: RedisCommandRawReply) => {
                    if (!callback) return;

                    // https://github.com/NodeRedis/node-redis#commands:~:text=minimal%20parsing

                    callback(null, reply);
                })
                .catch((err: Error) => {
                    if (!callback) {
                        this.emit('error', err);
                        return;
                    }

                    callback(err);
                });
        };

        for (const name of Object.keys(COMMANDS)) {
            this.#defineLegacyCommand(name);
        }

        // hard coded commands
        this.#defineLegacyCommand('SELECT');
        this.#defineLegacyCommand('select');
        this.#defineLegacyCommand('SUBSCRIBE');
        this.#defineLegacyCommand('subscribe');
        this.#defineLegacyCommand('PSUBSCRIBE');
        this.#defineLegacyCommand('pSubscribe');
        this.#defineLegacyCommand('UNSUBSCRIBE');
        this.#defineLegacyCommand('unsubscribe');
        this.#defineLegacyCommand('PUNSUBSCRIBE');
        this.#defineLegacyCommand('pUnsubscribe');
        this.#defineLegacyCommand('QUIT');
        this.#defineLegacyCommand('quit');
    }

    #defineLegacyCommand(name: string): void {
        (this as any).#v4[name] = (this as any)[name].bind(this);
        (this as any)[name] = (...args: Array<unknown>): void => {
            (this as any).sendCommand(name, ...args);
        };
    }

    duplicate(overrides?: Partial<RedisClientOptions<M, S>>): RedisClientType<M, S> {
        return new (Object.getPrototypeOf(this).constructor)({
            ...this.#options,
            ...overrides
        });
    }

    async connect(): Promise<void> {
        await this.#socket.connect();
    }

    async commandsExecutor(command: RedisCommand, args: Array<unknown>): Promise<RedisCommandReply<typeof command>> {
        const { args: redisArgs, options } = transformCommandArguments<ClientCommandOptions>(command, args);

        return transformCommandReply(
            command,
            await this.#sendCommand(redisArgs, options, command.BUFFER_MODE),
            redisArgs.preserve
        );
    }

    sendCommand<T = RedisCommandRawReply>(args: RedisCommandArguments, options?: ClientCommandOptions, bufferMode?: boolean): Promise<T> {
        return this.#sendCommand(args, options, bufferMode);
    }

    // using `#sendCommand` cause `sendCommand` is overwritten in legacy mode
    #sendCommand<T = RedisCommandRawReply>(args: RedisCommandArguments, options?: ClientCommandOptions, bufferMode?: boolean): Promise<T> {
        if (!this.#socket.isOpen) {
            return Promise.reject(new ClientClosedError());
        }

        if (options?.isolated) {
            return this.executeIsolated(isolatedClient =>
                isolatedClient.sendCommand(args, {
                    ...options,
                    isolated: false
                })
            );
        }

        const promise = this.#queue.addCommand<T>(args, options, bufferMode);
        this.#tick();
        return promise;
    }

    async scriptsExecutor(script: RedisScript, args: Array<unknown>): Promise<RedisCommandReply<typeof script>> {
        const { args: redisArgs, options } = transformCommandArguments<ClientCommandOptions>(script, args);

        return transformCommandReply(
            script,
            await this.executeScript(script, redisArgs, options, script.BUFFER_MODE),
            redisArgs.preserve
        );
    }

    async executeScript(script: RedisScript, args: RedisCommandArguments, options?: ClientCommandOptions, bufferMode?: boolean): Promise<RedisCommandReply<typeof script>> {
        try {
            return await this.#sendCommand([
                'EVALSHA',
                script.SHA1,
                script.NUMBER_OF_KEYS.toString(),
                ...args
            ], options, bufferMode);
        } catch (err: any) {
            if (!err?.message?.startsWith?.('NOSCRIPT')) {
                throw err;
            }

            return await this.#sendCommand([
                'EVAL',
                script.SCRIPT,
                script.NUMBER_OF_KEYS.toString(),
                ...args
            ], options, bufferMode);
        }
    }

    async SELECT(db: number): Promise<void>;
    async SELECT(options: CommandOptions<ClientCommandOptions>, db: number): Promise<void>;
    async SELECT(options?: any, db?: any): Promise<void> {
        if (!isCommandOptions(options)) {
            db = options;
            options = null;
        }

        await this.#sendCommand(['SELECT', db.toString()], options);
        this.#selectedDB = db;
    }

    select = this.SELECT;

    SUBSCRIBE(channels: string | Array<string>, listener: PubSubListener): Promise<void> {
        return this.#subscribe(PubSubSubscribeCommands.SUBSCRIBE, channels, listener);
    }

    subscribe = this.SUBSCRIBE;

    PSUBSCRIBE(patterns: string | Array<string>, listener: PubSubListener): Promise<void> {
        return this.#subscribe(PubSubSubscribeCommands.PSUBSCRIBE, patterns, listener);
    }

    pSubscribe = this.PSUBSCRIBE;

    #subscribe(command: PubSubSubscribeCommands, channels: string | Array<string>, listener: PubSubListener): Promise<void> {
        const promise = this.#queue.subscribe(command, channels, listener);
        this.#tick();
        return promise;
    }

    UNSUBSCRIBE(channels?: string | Array<string>, listener?: PubSubListener): Promise<void> {
        return this.#unsubscribe(PubSubUnsubscribeCommands.UNSUBSCRIBE, channels, listener);
    }

    unsubscribe = this.UNSUBSCRIBE;

    PUNSUBSCRIBE(patterns?: string | Array<string>, listener?: PubSubListener): Promise<void> {
        return this.#unsubscribe(PubSubUnsubscribeCommands.PUNSUBSCRIBE, patterns, listener);
    }

    pUnsubscribe = this.PUNSUBSCRIBE;

    #unsubscribe(command: PubSubUnsubscribeCommands, channels?: string | Array<string>, listener?: PubSubListener): Promise<void> {
        const promise = this.#queue.unsubscribe(command, channels, listener);
        this.#tick();
        return promise;
    }

    QUIT(): Promise<void> {
        return this.#socket.quit(() => {
            const quitPromise = this.#queue.addCommand(['QUIT']);
            this.#tick();
            return Promise.all([
                quitPromise,
                this.#destroyIsolationPool()
            ]);
        });
    }

    quit = this.QUIT;

    #tick(force = false): void {
        if (this.#socket.writableNeedDrain || (!force && !this.#socket.isReady)) {
            return;
        }

        this.#socket.cork();

        while (!this.#socket.writableNeedDrain) {
            const args = this.#queue.getCommandToSend();
            if (args === undefined) break;

            this.#socket.writeCommand(args);
        }
    }

    executeIsolated<T>(fn: (client: RedisClientType<M, S>) => T | Promise<T>): Promise<T> {
        return this.#isolationPool.use(fn);
    }

    multi(): RedisClientMultiCommandType<M, S> {
        return new (this as any).Multi(
            this.multiExecutor.bind(this),
            this.#options?.legacyMode
        );
    }

    multiExecutor(commands: Array<RedisMultiQueuedCommand>, chainId?: symbol): Promise<Array<RedisCommandRawReply>> {
        const promise = Promise.all(
            commands.map(({ args }) => {
                return this.#queue.addCommand(args, RedisClient.commandOptions({
                    chainId
                }));
            })
        );

        this.#tick();

        return promise;
    }

    async* scanIterator(options?: ScanCommandOptions): AsyncIterable<string> {
        let cursor = 0;
        do {
            const reply = await (this as any).scan(cursor, options);
            cursor = reply.cursor;
            for (const key of reply.keys) {
                yield key;
            }
        } while (cursor !== 0);
    }

    async* hScanIterator(key: string, options?: ScanOptions): AsyncIterable<HScanTuple> {
        let cursor = 0;
        do {
            const reply = await (this as any).hScan(key, cursor, options);
            cursor = reply.cursor;
            for (const tuple of reply.tuples) {
                yield tuple;
            }
        } while (cursor !== 0);
    }

    async* sScanIterator(key: string, options?: ScanOptions): AsyncIterable<string> {
        let cursor = 0;
        do {
            const reply = await (this as any).sScan(key, cursor, options);
            cursor = reply.cursor;
            for (const member of reply.members) {
                yield member;
            }
        } while (cursor !== 0);
    }

    async* zScanIterator(key: string, options?: ScanOptions): AsyncIterable<ZMember> {
        let cursor = 0;
        do {
            const reply = await (this as any).zScan(key, cursor, options);
            cursor = reply.cursor;
            for (const member of reply.members) {
                yield member;
            }
        } while (cursor !== 0);
    }

    async disconnect(): Promise<void> {
        this.#queue.flushAll(new DisconnectsClientError());
        this.#socket.disconnect();
        await this.#destroyIsolationPool();
    }

    async #destroyIsolationPool(): Promise<void> {
        await this.#isolationPool.drain();
        await this.#isolationPool.clear();
    }
}

extendWithCommands({
    BaseClass: RedisClient,
    commands: COMMANDS,
    executor: RedisClient.prototype.commandsExecutor
});
(RedisClient.prototype as any).Multi = RedisClientMultiCommand;
