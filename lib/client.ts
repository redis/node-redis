import RedisSocket, { RedisSocketOptions } from './socket';
import RedisCommandsQueue, { QueueCommandOptions } from './commands-queue';
import COMMANDS from './commands/client';
import { RedisCommand, RedisModules, RedisReply } from './commands';
import RedisMultiCommand, { MultiQueuedCommand, RedisMultiCommandType } from './multi-command';
import EventEmitter from 'events';
import { CommandOptions, commandOptions, isCommandOptions } from './command-options';
import { RedisLuaScript, RedisLuaScripts } from './lua-script';

export interface RedisClientOptions<M = RedisModules, S = RedisLuaScripts> {
    socket?: RedisSocketOptions;
    modules?: M;
    scripts?: S;
    commandsQueueMaxLength?: number;
    readOnly?: boolean;
    callbackify?: boolean;
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

export type RedisClientType<M extends RedisModules, S extends RedisLuaScripts> = WithCommands & WithModules<M> & WithScripts<S> & RedisClient<M, S>;

export interface ClientCommandOptions extends QueueCommandOptions {
    duplicateConnection?: boolean;
}

export default class RedisClient<M extends RedisModules = RedisModules, S extends RedisLuaScripts = RedisLuaScripts> extends EventEmitter {
    static defineCommand(on: any, name: string, command: RedisCommand): void {
        on[name] = async function (...args: Array<unknown>): Promise<unknown> {
            const options = isCommandOptions(args[0]) && args.shift();
            return command.transformReply(
                await this.sendCommand(
                    command.transformArguments(...args),
                    options
                )
            );
        };
    }

    static callbackifyCommand(on: any, name: string): void {
        const originalFunction = on[name + 'Async'] = on[name];
        on[name] = function (...args: Array<unknown>) {
            const hasCallback = typeof args[args.length - 1] === 'function',
                callback = (hasCallback && args.pop()) as Function;

            const promise = originalFunction.apply(this, args);
            if (hasCallback) {
                promise
                    .then((reply: RedisReply) => callback(null, reply))
                    .catch((err: Error) => callback(err));
            } else {
                promise
                    .catch((err: Error) => this.emit('error', err));
            }
        };
    }

    static create<M extends RedisModules, S extends RedisLuaScripts>(options?: RedisClientOptions<M, S>): RedisClientType<M, S> {
        return <any>new RedisClient<M, S>(options);
    }

    static commandOptions(options: ClientCommandOptions): CommandOptions<ClientCommandOptions> {
        return commandOptions(options);
    };

    readonly #options?: RedisClientOptions<M, S>;
    readonly #socket: RedisSocket;
    readonly #queue: RedisCommandsQueue;
    readonly #Multi: typeof RedisMultiCommand & { new(): RedisMultiCommandType<M, S> };
    #selectedDB = 0;

    get options(): RedisClientOptions<M> | null | undefined {
        return this.#options;
    }

    get isOpen(): boolean {
        return this.#socket.isOpen;
    }

    constructor(options?: RedisClientOptions<M, S>) {
        super();
        this.#options = options;
        this.#socket = this.#initiateSocket();
        this.#queue = this.#initiateQueue();
        this.#Multi = this.#initiateMulti();
        this.#initiateModules();
        this.#initiateScripts();
        this.#callbackify();
    }

    #initiateSocket(): RedisSocket {
        const socketInitiator = async (): Promise<void> => {
            const promises = [];

            if (this.#options?.socket?.password) {
                promises.push((this as any).auth(RedisClient.commandOptions({ asap: true }), this.#options?.socket));
            }

            if (this.#options?.readOnly) {
                promises.push((this as any).readOnly(RedisClient.commandOptions({ asap: true })));
            }

            if (this.#selectedDB !== 0) {
                promises.push((this as any).select(RedisClient.commandOptions({ asap: true }), this.#selectedDB));
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

            const replies = await promise;
            return (replies[replies.length - 1] as Array<RedisReply>);
        };

        const options = this.#options;
        return <any>class extends RedisMultiCommand {
            constructor() {
                super(executor, options?.modules, options?.scripts);
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
                    await this.#executeScript(script, [
                        script.NUMBER_OF_KEYS.toString(),
                        ...script.transformArguments(options ? args.slice(1) : args)
                    ])
                );
            };
        }
    }

    async #executeScript<S extends RedisLuaScript>(script: S, args: Array<string>): Promise<ReturnType<S['transformReply']>> {
        try {
            return await this.sendCommand(['EVALSHA', script.SHA, ...args]);        
        } catch (err: any) {
            if (!err?.message?.startsWith?.('NOSCRIPT')) {
                throw err;
            }

            return await this.sendCommand(['EVAL', script.SCRIPT, ...args]);
        }
    }

    #callbackify(): void {
        if (!this.#options?.callbackify) return;

        for (const name of Object.keys(COMMANDS)) {
            RedisClient.callbackifyCommand(this, name);
            RedisClient.callbackifyCommand(this.#Multi.prototype, name);
        }

        if (!this.#options?.modules) return;

        for (const m of this.#options.modules) {
            for (const name of Object.keys(m)) {
                RedisClient.callbackifyCommand(this, name);
                RedisClient.callbackifyCommand(this.#Multi.prototype, name);
            }
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

        await this.sendCommand(['SELECT', db.toString()], options);
        this.#selectedDB = db;
    }

    select = this.SELECT;

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
