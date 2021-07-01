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
    [P in keyof M[number]]: RedisCommandSignature<M[number][P]>;
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
    static defineCommand(on: any, name: string, command: RedisCommand): void {
        on[name] = async function (...args: Array<unknown>): Promise<unknown> {
            const options = isCommandOptions(args[0]) && args[0];
            return command.transformReply(
                await this.sendCommand(
                    command.transformArguments(...(options ? args.slice(1) : args)),
                    options
                )
            );
        };
    }

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
    readonly #v4: Record<string, Function> = {};
    #selectedDB = 0;

    get options(): RedisClientOptions<M> | null | undefined {
        return this.#options;
    }

    get isOpen(): boolean {
        return this.#socket.isOpen;
    }

    get v4(): Record<string, Function> {
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
            const promises = [];

            if (this.#selectedDB !== 0) {
                promises.push((this as any).select(RedisClient.commandOptions({ asap: true }), this.#selectedDB));
            }

            if (this.#options?.readonly) {
                promises.push((this as any).readonly(RedisClient.commandOptions({ asap: true })));
            }

            if (this.#options?.socket?.password) {
                promises.push((this as any).auth(RedisClient.commandOptions({ asap: true }), this.#options?.socket));
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

        for (const m of this.#options.modules) {
            for (const [name, command] of Object.entries(m)) {
                RedisClient.defineCommand(this, name, command);
                this.#Multi.defineCommand(this.#Multi, name, command);
            }
        }
    }

    #initiateScripts(): void {
        if (!this.#options?.scripts) return;

        for (const [name, script] of Object.entries(this.#options.scripts)) {
            (this as any)[name] = async function (...args: Parameters<typeof script.transformArguments>): Promise<ReturnType<typeof script.transformReply>> {
                const options = isCommandOptions(args[0]) && args[0];
                return script.transformReply(
                    await this.executeScript(
                        script,
                        ...script.transformArguments(...(options ? args.slice(1) : args))
                    )
                );
            };
        }
    }

    async executeScript<S extends RedisLuaScript>(script: S, args: Array<string>, options?: ClientCommandOptions): Promise<ReturnType<S['transformReply']>> {
        try {
            return await this.sendCommand([
                'EVALSHA',
                script.SHA,
                script.NUMBER_OF_KEYS.toString(),
                ...args
            ], options);        
        } catch (err: any) {
            if (!err?.message?.startsWith?.('NOSCRIPT')) {
                throw err;
            }

            return await this.sendCommand([
                'EVAL',
                script.SCRIPT,
                script.NUMBER_OF_KEYS.toString(),
                ...args
            ], options);
        }
    }

    #legacyMode(): void {
        if (!this.#options?.legacyMode) return;

        this.#v4.sendCommand = this.sendCommand.bind(this);

        (this as any).sendCommand = (...args: Array<unknown>): void => {
            const options = isCommandOptions(args[0]) && args.shift(),
                callback = typeof args[args.length - 1] === 'function' && (args.pop() as Function);
            
            this.#v4.sendCommand(args.flat(), options)
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
            for (const m of this.#options.modules) {
                for (const name of Object.keys(m)) {
                    this.#defineLegacyCommand(name);
                }
            }
        }

        if (this.#options?.scripts) {
            for (const name of Object.keys(this.#options.scripts)) {
                this.#defineLegacyCommand(name);
            }
        }
    }

    #defineLegacyCommand(name: string): void {
        this.#v4[name] = (this as any)[name];
        (this as any)[name] = function (...args: Array<unknown>): void {
            this.sendCommand(name, ...args);
        };
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

        await this.sendCommand(['SELECT', db.toString()], options);
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

    async sendCommand<T = unknown>(args: Array<string>, options?: ClientCommandOptions): Promise<T> {
        if (options?.duplicateConnection) {
            const duplicate = this.duplicate();
            await duplicate.connect();

            try {
                return await duplicate.sendCommand(args, {
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

    async* hScanIterator(key: string, options?: ScanOptions): AsyncIterable<string> {
        let cursor = 0;
        do {
            const reply = await (this as any).hScan(key, cursor, options);
            cursor = reply.cursor;
            for (const key of reply.keys) {
                yield key;
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

    #tick(): void {
        const {chunkRecommendedSize} = this.#socket;
        if (!chunkRecommendedSize) {
            return;
        }

        // TODO: batch using process.nextTick? maybe socket.setNoDelay(false)?

        const isBuffering = this.#queue.executeChunk(chunkRecommendedSize);
        if (isBuffering === true) {
            this.#socket.once('drain', () => this.#tick());
        } else if (isBuffering === false) {
            this.#tick();
        }
    }
}

for (const [name, command] of Object.entries(COMMANDS)) {
    RedisClient.defineCommand(RedisClient.prototype, name, command);
}
