import COMMANDS from './commands/client';
import { RedisCommand, RedisModules, RedisReply } from './commands';
import RedisCommandsQueue from './commands-queue';
import { RedisLuaScript, RedisLuaScripts } from './lua-script';
import { RedisClientOptions } from './client';

type RedisMultiCommandSignature<C extends RedisCommand, M extends RedisModules, S extends RedisLuaScripts> = (...args: Parameters<C['transformArguments']>) => RedisMultiCommandType<M, S>;

type WithCommands<M extends RedisModules, S extends RedisLuaScripts> = {
    [P in keyof typeof COMMANDS]: RedisMultiCommandSignature<(typeof COMMANDS)[P], M, S>
};

type WithModules<M extends RedisModules, S extends RedisLuaScripts> = {
    [P in keyof M[number]]: RedisMultiCommandSignature<M[number][P], M, S>
};

type WithScripts<M extends RedisModules, S extends RedisLuaScripts> = {
    [P in keyof S]: RedisMultiCommandSignature<S[P], M, S>
};

export type RedisMultiCommandType<M extends RedisModules, S extends RedisLuaScripts> = RedisMultiCommand & WithCommands<M, S> & WithModules<M, S> & WithScripts<M, S>;

export interface MultiQueuedCommand {
    encodedCommand: string;
    transformReply?: RedisCommand['transformReply'];
}

export type RedisMultiExecutor = (queue: Array<MultiQueuedCommand>, chainId?: Symbol) => Promise<Array<RedisReply>>;

export default class RedisMultiCommand<M extends RedisModules = RedisModules, S extends RedisLuaScripts = RedisLuaScripts> {
    static defineCommand(on: any, name: string, command: RedisCommand): void {
        on[name] = function (...args: Parameters<typeof command.transformArguments>) {
            // do not return `this.addCommand` directly cause in legacy mode it's binded to the legacy version 
            this.addCommand(command.transformArguments(...args), command.transformReply);
            return this;
        };
    }

    static create<M extends RedisModules, S extends RedisLuaScripts>(executor: RedisMultiExecutor, clientOptions?: RedisClientOptions<M, S>): RedisMultiCommandType<M, S> {
        return <any>new RedisMultiCommand<M, S>(executor, clientOptions);
    }

    readonly #executor: RedisMultiExecutor;

    readonly #clientOptions: RedisClientOptions<M, S> | undefined;

    readonly #queue: Array<MultiQueuedCommand> = [];

    readonly #scriptsInUse = new Set<string>();

    readonly #modern: Record<string, Function> = {};

    get modern(): Record<string, Function> {
        if (!this.#clientOptions?.legacyMode) {
            throw new Error('client is not in "legacy mode"');
        }

        return this.#modern;
    }

    constructor(executor: RedisMultiExecutor, clientOptions?: RedisClientOptions<M, S>) {
        this.#executor = executor;
        this.#clientOptions = clientOptions;
        this.#initiateModules();
        this.#initiateScripts();
        this.#legacyMode();
    }

    #initiateModules(): void {
        if (!this.#clientOptions?.modules) return;

        for (const m of this.#clientOptions.modules) {
            for (const [name, command] of Object.entries(m)) {
                RedisMultiCommand.defineCommand(this, name, command);
            }
        }
    }

    #initiateScripts(): void {
        if (!this.#clientOptions?.scripts) return;

        for (const [name, script] of Object.entries(this.#clientOptions.scripts)) {
            (this as any)[name] = function (...args: Array<unknown>) {
                const evalArgs = [];
                if (this.#scriptsInUse.has(name)) {
                    evalArgs.push(
                        'EVALSHA',
                        script.SHA
                    );
                } else {
                    this.#scriptsInUse.add(name);
                    evalArgs.push(
                        'EVAL',
                        script.SCRIPT
                    );
                }
    
                return this.addCommand(
                    [
                        ...evalArgs,
                        script.NUMBER_OF_KEYS,
                        ...script.transformArguments(...args)
                    ],
                    script.transformReply
                );
            };
        }
    }

    #legacyMode(): Record<string, Function> | undefined {
        if (!this.#clientOptions?.legacyMode) return;

        this.#modern.exec = this.exec.bind(this);
        this.#modern.addCommand = this.addCommand.bind(this);

        (this as any).exec = function (...args: Array<unknown>): void {
            const callback = typeof args[args.length - 1] === 'function' && args.pop() as Function;
            this.#modern.exec()
                .then((reply: unknown) => {
                    if (!callback) return;

                    callback(null, reply);
                })
                .catch((err: Error) => {
                    if (!callback) {
                        // this.emit('error', err);
                        return;
                    }

                    callback(err);
                });
        };


        for (const name of Object.keys(COMMANDS)) {
            this.#defineLegacyCommand(name);
        }

        if (this.#clientOptions.modules) {
            for (const m of this.#clientOptions.modules) {
                for (const name of Object.keys(m)) {
                    this.#defineLegacyCommand(name);
                }
            }
        }

        if (this.#clientOptions.scripts) {
            for (const name of Object.keys(this.#clientOptions.scripts)) {
                this.#defineLegacyCommand(name);
            }
        }
    }

    #defineLegacyCommand(name: string): void {
        this.#modern[name] = (this as any)[name];

        // TODO: https://github.com/NodeRedis/node-redis#commands:~:text=minimal%20parsing
        (this as any)[name] = function (...args: Array<unknown>) {
            return this.addCommand([name, ...args.flat()]);
        };
    }

    addCommand(args: Array<string>, transformReply?: RedisCommand['transformReply']): this {
        this.#queue.push({
            encodedCommand: RedisCommandsQueue.encodeCommand(args),
            transformReply
        });

        return this;
    }

    async exec(execAsPipeline: boolean = false): Promise<Array<unknown>> {
        if (execAsPipeline) {
            return this.execAsPipeline();
        } else if (!this.#queue.length) {
            return [];
        }

        const queue = this.#queue.splice(0);
        queue.unshift({
            encodedCommand: RedisCommandsQueue.encodeCommand(['MULTI'])
        });
        queue.push({
            encodedCommand: RedisCommandsQueue.encodeCommand(['EXEC'])
        });

        const rawReplies = await this.#executor(queue, Symbol('[RedisMultiCommand] Chain ID'));
        console.log('!@#!@#!@#', rawReplies);
        return (rawReplies[rawReplies.length - 1]! as Array<RedisReply>).map((reply, i) => {
            const { transformReply } = queue[i + 1];
            return transformReply ? transformReply(reply) : reply;
        });
    }

    async execAsPipeline(): Promise<Array<unknown>> {
        if (!this.#queue.length) {
            return [];
        }

        return await this.#executor(this.#queue.splice(0));
    }
}

for (const [name, command] of Object.entries(COMMANDS)) {
    RedisMultiCommand.defineCommand(RedisMultiCommand.prototype, name, command);
}
