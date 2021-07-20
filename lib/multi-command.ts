import COMMANDS, { TransformArgumentsReply } from './commands';
import { RedisCommand, RedisModules, RedisReply } from './commands';
import RedisCommandsQueue from './commands-queue';
import { RedisLuaScripts } from './lua-script';
import { RedisClientOptions } from './client';

type RedisMultiCommandSignature<C extends RedisCommand, M extends RedisModules, S extends RedisLuaScripts> = (...args: Parameters<C['transformArguments']>) => RedisMultiCommandType<M, S>;

type WithCommands<M extends RedisModules, S extends RedisLuaScripts> = {
    [P in keyof typeof COMMANDS]: RedisMultiCommandSignature<(typeof COMMANDS)[P], M, S>
};

type WithModules<M extends RedisModules, S extends RedisLuaScripts> = {
    [P in keyof M]: {
        [C in keyof M[P]]: RedisMultiCommandSignature<M[P][C], M, S>;
    };
};

type WithScripts<M extends RedisModules, S extends RedisLuaScripts> = {
    [P in keyof S]: RedisMultiCommandSignature<S[P], M, S>
};

export type RedisMultiCommandType<M extends RedisModules, S extends RedisLuaScripts> = RedisMultiCommand & WithCommands<M, S> & WithModules<M, S> & WithScripts<M, S>;

export interface MultiQueuedCommand {
    encodedCommand: string;
    preservedArguments?: unknown;
    transformReply?: RedisCommand['transformReply'];
}

export type RedisMultiExecutor = (queue: Array<MultiQueuedCommand>, chainId?: symbol) => Promise<Array<RedisReply>>;

export default class RedisMultiCommand<M extends RedisModules = RedisModules, S extends RedisLuaScripts = RedisLuaScripts> {
    static create<M extends RedisModules, S extends RedisLuaScripts>(executor: RedisMultiExecutor, clientOptions?: RedisClientOptions<M, S>): RedisMultiCommandType<M, S> {
        return <any>new RedisMultiCommand<M, S>(executor, clientOptions);
    }

    readonly #executor: RedisMultiExecutor;

    readonly #clientOptions: RedisClientOptions<M, S> | undefined;

    readonly #queue: Array<MultiQueuedCommand> = [];

    readonly #scriptsInUse = new Set<string>();

    readonly #v4: Record<string, any> = {};

    get v4(): Record<string, any> {
        if (!this.#clientOptions?.legacyMode) {
            throw new Error('client is not in "legacy mode"');
        }

        return this.#v4;
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

        for (const [moduleName, commands] of Object.entries(this.#clientOptions.modules)) {
            const module: {
                [P in keyof typeof commands]: RedisMultiCommandSignature<(typeof commands)[P], M, S>
            } = {};

            for (const [commandName, command] of Object.entries(commands)) {
                module[commandName] = (...args) => this.executeCommand(command, args);
            }

            (this as any)[moduleName] = module;
        }
    }

    #initiateScripts(): void {
        if (!this.#clientOptions?.scripts) return;

        for (const [name, script] of Object.entries(this.#clientOptions.scripts)) {
            (this as any)[name] = function (...args: Array<unknown>) {
                const transformedArgs: TransformArgumentsReply = [];
                if (this.#scriptsInUse.has(name)) {
                    transformedArgs.push(
                        'EVALSHA',
                        script.SHA
                    );
                } else {
                    this.#scriptsInUse.add(name);
                    transformedArgs.push(
                        'EVAL',
                        script.SCRIPT
                    );
                }

                transformedArgs.push(script.NUMBER_OF_KEYS.toString());

                const scriptArgs = script.transformArguments(...args);
                transformedArgs.push(...scriptArgs);
                transformedArgs.preserve = scriptArgs.preserve;

                return this.addCommand(
                    transformedArgs,
                    script.transformReply
                );
            };
        }
    }

    #legacyMode(): void {
        if (!this.#clientOptions?.legacyMode) return;

        this.#v4.exec = this.exec.bind(this);

        (this as any).exec = (callback?: (err: Error | null, replies?: Array<unknown>) => unknown): void => {
            this.#v4.exec()
                .then((reply: Array<unknown>) => {
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

        if (this.#clientOptions?.modules) {
            for (const [module, commands] of Object.entries(this.#clientOptions.modules)) {
                for (const name of Object.keys(commands)) {
                    this.#v4[module] = {};
                    this.#defineLegacyCommand(name, module);
                }
            }
        }

        if (this.#clientOptions.scripts) {
            for (const name of Object.keys(this.#clientOptions.scripts)) {
                this.#defineLegacyCommand(name);
            }
        }
    }

    #defineLegacyCommand(name: string, moduleName?: string): void {
        const handler = (...args: Array<unknown>): RedisMultiCommandType<M, S> => {
            return this.addCommand([
                name,
                ...args.flat() as Array<string>
            ]);
        };

        if (moduleName) {
            this.#v4[moduleName][name] = (this as any)[moduleName][name];
            (this as any)[moduleName][name] = handler;
        } else {
            this.#v4[name] = (this as any)[name].bind(this);
            (this as any)[name] = handler;
        }
    }

    addCommand(args: TransformArgumentsReply, transformReply?: RedisCommand['transformReply']): RedisMultiCommandType<M, S> {
        this.#queue.push({
            encodedCommand: RedisCommandsQueue.encodeCommand(args),
            preservedArguments: args.preserve,
            transformReply
        });

        return <any>this;
    }

    executeCommand(command: RedisCommand, args: Array<unknown>): RedisMultiCommandType<M, S> {
        return this.addCommand(
            command.transformArguments(...args),
            command.transformReply
        );
    }

    async exec(execAsPipeline = false): Promise<Array<unknown>> {
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
        return (rawReplies[rawReplies.length - 1]! as Array<RedisReply>).map((reply, i) => {
            const { transformReply, preservedArguments } = queue[i + 1];
            return transformReply ? transformReply(reply, preservedArguments) : reply;
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
    (RedisMultiCommand.prototype as any)[name] = function (...args: Array<unknown>): RedisMultiCommand {
        return this.executeCommand(command, args);
    };
}
