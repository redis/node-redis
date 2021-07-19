import RedisSocket, { RedisSocketOptions } from './socket';
import RedisCommandsQueue, { PubSubListener, PubSubSubscribeCommands, PubSubUnsubscribeCommands, QueueCommandOptions } from './commands-queue';
import COMMANDS from './commands';
import { RedisCommand, RedisModules, RedisReply } from './commands';
import RedisMultiCommand, { MultiQueuedCommand, RedisMultiCommandType } from './multi-command';
import EventEmitter from 'events';
import { CommandOptions, commandOptions, isCommandOptions } from './command-options';
import { RedisLuaScript, RedisLuaScripts } from './lua-script';
import { ScanOptions, ZMember } from './commands/generic-transformers';
import { ScanCommandOptions } from './commands/SCAN';
import { HScanTuple } from './commands/HSCAN';

export interface RedisClientOptions<M = RedisModules, S = RedisLuaScripts> {
    socket?: RedisSocketOptions;
    modules?: M;
    scripts?: S;
    commandsQueueMaxLength?: number;
    readonly?: boolean;
    legacyMode?: boolean;
}

export type RedisCommandSignature<C extends RedisCommand> =
    (...args: Parameters<C['transformArguments']> | [options: CommandOptions<ClientCommandOptions>, ...rest: Parameters<C['transformArguments']>]) => Promise<ReturnType<C['transformReply']>>;

type WithCommands = {
    [P in keyof typeof COMMANDS]: RedisCommandSignature<(typeof COMMANDS)[P]>;
};

type WithModules<M extends RedisModules> = {
    [P in keyof M]: {
        [C in keyof M[P]]: RedisCommandSignature<M[P][C]>;
    };
};

type WithScripts<S extends RedisLuaScripts> = {
    [P in keyof S]: RedisCommandSignature<S[P]>;
};

export type WithPlugins<M extends RedisModules, S extends RedisLuaScripts> =
    WithCommands & WithModules<M> & WithScripts<S>;

export type RedisClientType<M extends RedisModules, S extends RedisLuaScripts> =
    WithPlugins<M, S> & RedisClient<M, S>;

export interface ClientCommandOptions extends QueueCommandOptions {
    duplicateConnection?: boolean;
}

export default class RedisClient<M extends RedisModules = RedisModules, S extends RedisLuaScripts = RedisLuaScripts> extends EventEmitter {
    static create<M extends RedisModules, S extends RedisLuaScripts>(options?: RedisClientOptions<M, S>): RedisClientType<M, S> {
        return <any>new RedisClient<M, S>(options);
    }

    static commandOptions(options: ClientCommandOptions): CommandOptions<ClientCommandOptions> {
        return commandOptions(options);
    }

    readonly #options?: RedisClientOptions<M, S>;
    readonly #socket: RedisSocket;
    readonly #queue: RedisCommandsQueue;
    readonly #Multi: typeof RedisMultiCommand & { new(): RedisMultiCommandType<M, S> };
    readonly #v4: Record<string, any> = {};
    #selectedDB = 0;

    get options(): RedisClientOptions<M> | null | undefined {
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
        this.#options = options;
        this.#socket = this.#initiateSocket();
        this.#queue = this.#initiateQueue();
        this.#Multi = this.#initiateMulti();
        this.#initiateModules();
        this.#initiateScripts();
        this.#legacyMode();
    }

    #initiateSocket(): RedisSocket {
        const socketInitiator = async (): Promise<void> => {
            const v4Commands = this.#options?.legacyMode ? this.#v4 : this,
                promises = [];

            if (this.#selectedDB !== 0) {
                promises.push(v4Commands.select(RedisClient.commandOptions({ asap: true }), this.#selectedDB));
            }

            if (this.#options?.readonly) {
                promises.push(v4Commands.readonly(RedisClient.commandOptions({ asap: true })));
            }

            if (this.#options?.socket?.password) {
                promises.push(v4Commands.auth(RedisClient.commandOptions({ asap: true }), this.#options.socket));
            }

            const resubscribePromise = this.#queue.resubscribe();
            if (resubscribePromise) {
                promises.push(resubscribePromise);
                this.#tick();
            }

            await Promise.all(promises);
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
            .on('end', () => this.emit('end'));
    }

    #initiateQueue(): RedisCommandsQueue {
        return new RedisCommandsQueue(
            this.#options?.commandsQueueMaxLength,
            (encodedCommands: string) => this.#socket.write(encodedCommands)
        );
    }

    #initiateMulti(): typeof RedisMultiCommand & { new(): RedisMultiCommandType<M, S> } {
        const executor = async (commands: Array<MultiQueuedCommand>): Promise<Array<RedisReply>> => {
            const promise = Promise.all(
                commands.map(({encodedCommand}) => {
                    return this.#queue.addEncodedCommand(encodedCommand);
                })
            );

            this.#tick();

            return await promise;
        };

        const options = this.#options;
        return <any>class extends RedisMultiCommand {
            constructor() {
                super(executor, options);
            }
        };
    }

    #initiateModules(): void {
        if (!this.#options?.modules) return;

        for (const [moduleName, commands] of Object.entries(this.#options.modules)) {
            const module: {
                [P in keyof typeof commands]: RedisCommandSignature<(typeof commands)[P]>;
            } = {};

            for (const [commandName, command] of Object.entries(commands)) {
                module[commandName] = (...args) => this.executeCommand(command, args);
            }

            (this as any)[moduleName] = module;
        }
    }

    #initiateScripts(): void {
        if (!this.#options?.scripts) return;

        for (const [name, script] of Object.entries(this.#options.scripts)) {
            (this as any)[name] = async function (...args: Parameters<typeof script.transformArguments>): Promise<ReturnType<typeof script.transformReply>> {
                let options;
                if (isCommandOptions<ClientCommandOptions>(args[0])) {
                    options = args[0];
                    args = args.slice(1);
                }

                const transformedArguments = script.transformArguments(...args);
                return script.transformReply(
                    await this.executeScript(
                        script,
                        transformedArguments,
                        options
                    ),
                    transformedArguments.preserve
                );
            };
        }
    }

    async executeScript<S extends RedisLuaScript>(script: S, args: Array<string>, options?: ClientCommandOptions): Promise<ReturnType<S['transformReply']>> {
        try {
            return await this.#sendCommand([
                'EVALSHA',
                script.SHA,
                script.NUMBER_OF_KEYS.toString(),
                ...args
            ], options);
        } catch (err: any) {
            if (!err?.message?.startsWith?.('NOSCRIPT')) {
                throw err;
            }

            return await this.#sendCommand([
                'EVAL',
                script.SCRIPT,
                script.NUMBER_OF_KEYS.toString(),
                ...args
            ], options);
        }
    }

    #legacyMode(): void {
        if (!this.#options?.legacyMode) return;

        (this as any).#v4.sendCommand = this.sendCommand.bind(this);
        (this as any).sendCommand = (...args: Array<unknown>): void => {
            const options = isCommandOptions<ClientCommandOptions>(args[0]) ? args[0] : undefined,
                callback = typeof args[args.length - 1] === 'function' ? args[args.length - 1] as Function : undefined,
                actualArgs = !options && !callback ? args : args.slice(options ? 1 : 0, callback ? -1 : Infinity);
            this.#sendCommand(actualArgs.flat() as Array<string>, options)
                .then((reply: unknown) => {
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
        }

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

        if (this.#options?.modules) {
            for (const [module, commands] of Object.entries(this.#options.modules)) {
                for (const name of Object.keys(commands)) {
                    this.#v4[module] = {};
                    this.#defineLegacyCommand(name, module);
                }
            }
        }

        if (this.#options?.scripts) {
            for (const name of Object.keys(this.#options.scripts)) {
                this.#defineLegacyCommand(name);
            }
        }
    }

    #defineLegacyCommand(name: string, moduleName?: string): void {
        const handler = (...args: Array<unknown>): void => {
            (this as any).sendCommand(name, ...args);
        };

        if (moduleName) {
            (this as any).#v4[moduleName][name] = (this as any)[moduleName][name];
            (this as any)[moduleName][name] = handler;
        } else {
            (this as any).#v4[name] = (this as any)[name].bind(this);
            (this as any)[name] = handler;
        }
    }

    duplicate(): RedisClientType<M, S> {
        return RedisClient.create(this.#options);
    }

    async connect(): Promise<void> {
        await this.#socket.connect();
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

    sendCommand<T = unknown>(args: Array<string>, options?: ClientCommandOptions): Promise<T> {
        return this.#sendCommand(args, options);
    }

    async #sendCommand<T = unknown>(args: Array<string>, options?: ClientCommandOptions): Promise<T> {
        if (options?.duplicateConnection) {
            const duplicate = this.duplicate();
            await duplicate.connect();

            try {
                return await duplicate.#sendCommand(args, {
                    ...options,
                    duplicateConnection: false
                });
            } finally {
                await duplicate.disconnect();
            }
        }

        const promise = this.#queue.addCommand<T>(args, options);
        this.#tick();
        return await promise;
    }

    async executeCommand(command: RedisCommand, args: Array<unknown>): Promise<unknown> {
        let options;
        if (isCommandOptions<ClientCommandOptions>(args[0])) {
            options = args[0];
            args = args.slice(1);
        }

        const transformedArguments = command.transformArguments(...args);
        return command.transformReply(
            await this.#sendCommand(
                transformedArguments,
                options
            ),
            transformedArguments.preserve
        );
    }

    multi(): RedisMultiCommandType<M, S> {
        return new this.#Multi();
    }

    async* scanIterator(options?: ScanCommandOptions): AsyncIterable<string> {
        let cursor = 0;
        do {
            const reply = await (this as any).scan(cursor, options);
            cursor = reply.cursor;
            for (const key of reply.keys) {
                yield key;
            }
        } while (cursor !== 0)
    }

    async* hScanIterator(key: string, options?: ScanOptions): AsyncIterable<HScanTuple> {
        let cursor = 0;
        do {
            const reply = await (this as any).hScan(key, cursor, options);
            cursor = reply.cursor;
            for (const tuple of reply.tuples) {
                yield tuple;
            }
        } while (cursor !== 0)
    }

    async* sScanIterator(key: string, options?: ScanOptions): AsyncIterable<string> {
        let cursor = 0;
        do {
            const reply = await (this as any).sScan(key, cursor, options);
            cursor = reply.cursor;
            for (const member of reply.members) {
                yield member;
            }
        } while (cursor !== 0)
    }

    async* zScanIterator(key: string, options?: ScanOptions): AsyncIterable<ZMember> {
        let cursor = 0;
        do {
            const reply = await (this as any).zScan(key, cursor, options);
            cursor = reply.cursor;
            for (const member of reply.members) {
                yield member;
            }
        } while (cursor !== 0)
    }

    disconnect(): Promise<void> {
        this.#queue.flushAll(new Error('Disconnecting'));
        return this.#socket.disconnect();
    }

    #isTickQueued = false;

    #tick(): void {
        const {chunkRecommendedSize} = this.#socket;
        if (!chunkRecommendedSize) {
            return;
        }

        if (!this.#isTickQueued && this.#queue.waitingToBeSentCommandsLength < chunkRecommendedSize) {
            queueMicrotask(() => this.#tick());
            this.#isTickQueued = true;
            return;
        }

        const isBuffering = this.#queue.executeChunk(chunkRecommendedSize);
        if (isBuffering === true) {
            this.#socket.once('drain', () => this.#tick());
        } else if (isBuffering === false) {
            this.#tick();
            return;
        }

        this.#isTickQueued = false;
    }
}

for (const [name, command] of Object.entries(COMMANDS)) {
    (RedisClient.prototype as any)[name] = async function (this: RedisClient, ...args: Array<unknown>): Promise<unknown> {
        return this.executeCommand(command, args);
    };
}
