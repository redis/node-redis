import RedisSocket, { RedisSocketOptions } from './socket.js';
import RedisCommandsQueue, { AddCommandOptions } from './commands-queue.js';
import COMMANDS from './commands/client.js';
import { RedisCommand, RedisModules, RedisModule, RedisReply } from './commands/index.js';
import RedisMultiCommand, { MultiQueuedCommand, RedisMultiCommandType } from './multi-command.js';
import EventEmitter from 'events';

export interface RedisClientOptions<M = RedisModules> {
    socket?: RedisSocketOptions;
    modules?: M;
}

export type RedisCommandSignature<C extends RedisCommand> = (...args: Parameters<C['transformArguments']>) => Promise<ReturnType<C['transformReply']>>;

type WithCommands = {
    [P in keyof typeof COMMANDS]: RedisCommandSignature<(typeof COMMANDS)[P]>;
};

type WithModules<M extends Array<RedisModule>> = {
    [P in keyof M[number]]: RedisCommandSignature<M[number][P]>;
};

type WithMulti<M extends Array<RedisModule>> = {
    multi(): RedisMultiCommandType<M>
};

export type RedisClientType<M extends RedisModules> = WithCommands & WithModules<M> & WithMulti<M> & RedisClient;

export default class RedisClient extends EventEmitter {
    static defineCommand(on: any, name: string, command: RedisCommand) {
        on[name] = async function (...args: Array<unknown>): Promise<unknown> {
            return command.transformReply(
                await this.sendCommand(command.transformArguments(...args))
            );
        };
    }

    static create<M extends RedisModules>(options?: RedisClientOptions<M>): RedisClientType<M> {
        return <any>new RedisClient(options);
    }

    readonly #socket: RedisSocket;
    readonly #queue: RedisCommandsQueue;
    readonly #Multi;
    readonly #modules?: RedisModules;

    constructor(options?: RedisClientOptions) {
        super();
        this.#socket = this.#initiateSocket(options?.socket);
        this.#queue = this.#initiateQueue();
        this.#Multi = this.#initiateMulti();
        this.#modules = this.#initiateModules(options?.modules);
    }

    #initiateSocket(socketOptions?: RedisSocketOptions): RedisSocket {
        const socketInitiator = async (): Promise<void> => {
            if (socketOptions?.password) {
                await (this as any).auth(socketOptions);
            }
        };

        return new RedisSocket(socketInitiator, socketOptions)
            .on('data', data => this.#queue.parseResponse(data))
            .on('error', err => this.emit('error', err));
    }

    #initiateQueue(): RedisCommandsQueue {
        return new RedisCommandsQueue((encodedCommands: string) => this.#socket.write(encodedCommands));
    }

    #initiateMulti() {
        const executor = async (commands: Array<MultiQueuedCommand>): Promise<Array<RedisReply>> => {
            const promise = Promise.all(
                commands.map(({encodedCommand}) => {
                    return this.#queue.addEncodedCommand<RedisReply>(encodedCommand);
                })
            );

            this.#tick();

            return promise;
        };

        const modules = this.#modules;

        return <any>class extends RedisMultiCommand {
            constructor() {
                super(executor, modules);
            }
        };
    }

    #initiateModules(modules?: RedisModules): RedisModules | undefined {
        if (!modules) return;

        for (const m of modules) {
            for (const [name, command] of Object.entries(m)) {
                RedisClient.defineCommand(this, name, command);
                this.#Multi.defineCommand(this.#Multi, name, command);
            }
        }

        return modules;
    }

    async connect() {
        await this.#socket.connect();

        this.#tick();
    }

    sendCommand<T = unknown>(args: Array<string>, options?: AddCommandOptions): Promise<T> {
        const promise = this.#queue.addCommand<T>(args, options);

        this.#tick();

        return promise;
    }

    multi() {
        return new this.#Multi();
    }

    disconnect(): Promise<void> {
        return this.#socket.disconnect();
    }

    #tick(chunkRecommendedSize: number = this.#socket.chunkRecommendedSize): void {
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
