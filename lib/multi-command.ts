import COMMANDS, { TransformArgumentsReply } from './commands';
import { RedisCommand, RedisModules, RedisReply } from './commands';
import { RedisLuaScript, RedisLuaScripts } from './lua-script';
import { RedisClientOptions } from './client';
import { extendWithModulesAndScripts, extendWithDefaultCommands, encodeCommand } from './commander';
import { WatchError } from './errors';

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
    static commandsExecutor(this: RedisMultiCommand, command: RedisCommand, args: Array<unknown>): RedisMultiCommand {
        return this.addCommand(
            command.transformArguments(...args),
            command.transformReply
        );
    }

    static #scriptsExecutor(
        this: RedisMultiCommand,
        script: RedisLuaScript,
        args: Array<unknown>
    ): RedisMultiCommand {
        const transformedArguments: TransformArgumentsReply = [];
        if (this.#scriptsInUse.has(script.SHA1)) {
            transformedArguments.push(
                'EVALSHA',
                script.SHA1
            );
        } else {
            this.#scriptsInUse.add(script.SHA1);
            transformedArguments.push(
                'EVAL',
                script.SCRIPT
            );
        }

        transformedArguments.push(script.NUMBER_OF_KEYS.toString());

        const scriptArguments = script.transformArguments(...args);
        transformedArguments.push(...scriptArguments);
        transformedArguments.preserve = scriptArguments.preserve;

        return this.addCommand(
            transformedArguments,
            script.transformReply
        );
    }

    static extend<M extends RedisModules, S extends RedisLuaScripts>(
        clientOptions?: RedisClientOptions<M, S>
    ): new (...args: ConstructorParameters<typeof RedisMultiCommand>) => RedisMultiCommandType<M, S> {
        return <any>extendWithModulesAndScripts({
            BaseClass: RedisMultiCommand,
            modules: clientOptions?.modules,
            modulesCommandsExecutor: RedisMultiCommand.commandsExecutor,
            scripts: clientOptions?.scripts,
            scriptsExecutor: RedisMultiCommand.#scriptsExecutor
        });
    }

    static create<M extends RedisModules, S extends RedisLuaScripts>(
        executor: RedisMultiExecutor,
        clientOptions?: RedisClientOptions<M, S>
    ): RedisMultiCommandType<M, S> {
        return <any>new this(executor, clientOptions);
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
        this.#legacyMode();
    }

    #legacyMode(): void {
        if (!this.#clientOptions?.legacyMode) return;

        this.#v4.addCommand = this.addCommand.bind(this);
        (this as any).addCommand = (...args: Array<unknown>): this => {
            this.#queue.push({
                encodedCommand: encodeCommand(args.flat() as Array<string>)
            });
            return this;
        }
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
    }

    #defineLegacyCommand(name: string): void {
        (this as any).#v4[name] = (this as any)[name].bind(this.#v4);
        (this as any)[name] = (...args: Array<unknown>): void => (this as any).addCommand(name, args);
    }

    addCommand(args: TransformArgumentsReply, transformReply?: RedisCommand['transformReply']): this {
        this.#queue.push({
            encodedCommand: encodeCommand(args),
            preservedArguments: args.preserve,
            transformReply
        });

        return this;
    }

    async exec(execAsPipeline = false): Promise<Array<RedisReply>> {
        if (execAsPipeline) {
            return this.execAsPipeline();
        } else if (!this.#queue.length) {
            return [];
        }

        const queue = this.#queue.splice(0),
            rawReplies = await this.#executor([
                {
                    encodedCommand: encodeCommand(['MULTI'])
                },
                ...queue,
                {
                    encodedCommand: encodeCommand(['EXEC'])
                }
            ], Symbol('[RedisMultiCommand] Chain ID')),
            execReply = rawReplies[rawReplies.length - 1] as (null | Array<RedisReply>);

        if (execReply === null) {
            throw new WatchError();
        }

        return this.#transformReplies(execReply, queue);
    }

    async execAsPipeline(): Promise<Array<RedisReply>> {
        if (!this.#queue.length) {
            return [];
        }

        const queue = this.#queue.splice(0);
        return this.#transformReplies(
            await this.#executor(queue),
            queue
        );
    }

    #transformReplies(rawReplies: Array<RedisReply>, queue: Array<MultiQueuedCommand>): Array<RedisReply> {
        return rawReplies.map((reply, i) => {
            const { transformReply, preservedArguments } = queue[i];
            return transformReply ? transformReply(reply, preservedArguments) : reply;
        });
    }
}

extendWithDefaultCommands(RedisMultiCommand, RedisMultiCommand.commandsExecutor);
