import COMMANDS from './commands';
import { RedisCommand, RedisCommandArguments, RedisCommandRawReply, RedisFunctions, RedisModules, RedisExtensions, RedisScript, RedisScripts, ExcludeMappedString, RedisFunction, RedisCommands } from '../commands';
import RedisMultiCommand, { RedisMultiQueuedCommand } from '../multi-command';
import { attachCommands, attachExtensions, transformLegacyCommandArguments } from '../commander';

type CommandSignature<
    C extends RedisCommand,
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = (...args: Parameters<C['transformArguments']>) => RedisClientMultiCommandType<M, F, S>;

type WithCommands<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = {
    [P in keyof typeof COMMANDS]: CommandSignature<(typeof COMMANDS)[P], M, F, S>;
};

type WithModules<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = {
    [P in keyof M as ExcludeMappedString<P>]: {
        [C in keyof M[P] as ExcludeMappedString<C>]: CommandSignature<M[P][C], M, F, S>;
    };
};

type WithFunctions<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = {
    [P in keyof F as ExcludeMappedString<P>]: {
        [FF in keyof F[P] as ExcludeMappedString<FF>]: CommandSignature<F[P][FF], M, F, S>;
    };
};

type WithScripts<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = {
    [P in keyof S as ExcludeMappedString<P>]: CommandSignature<S[P], M, F, S>;
};

export type RedisClientMultiCommandType<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = RedisClientMultiCommand & WithCommands<M, F, S> & WithModules<M, F, S> & WithFunctions<M, F, S> & WithScripts<M, F, S>;

type InstantiableRedisMultiCommand<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = new (...args: ConstructorParameters<typeof RedisClientMultiCommand>) => RedisClientMultiCommandType<M, F, S>;

export type RedisClientMultiExecutor = (
    queue: Array<RedisMultiQueuedCommand>,
    selectedDB?: number,
    chainId?: symbol
) => Promise<Array<RedisCommandRawReply>>;

export default class RedisClientMultiCommand {
    static extend<
        M extends RedisModules,
        F extends RedisFunctions,
        S extends RedisScripts
    >(extensions?: RedisExtensions<M, F, S>): InstantiableRedisMultiCommand<M, F, S> {
        return attachExtensions({
            BaseClass: RedisClientMultiCommand,
            modulesExecutor: RedisClientMultiCommand.prototype.commandsExecutor,
            modules: extensions?.modules,
            functionsExecutor: RedisClientMultiCommand.prototype.functionsExecutor,
            functions: extensions?.functions,
            scriptsExecutor: RedisClientMultiCommand.prototype.scriptsExecutor,
            scripts: extensions?.scripts
        });
    }

    readonly #multi = new RedisMultiCommand();
    readonly #executor: RedisClientMultiExecutor;
    readonly v4: Record<string, any> = {};
    #selectedDB?: number;

    constructor(executor: RedisClientMultiExecutor, legacyMode = false) {
        this.#executor = executor;
        if (legacyMode) {
            this.#legacyMode();
        }
    }

    #legacyMode(): void {
        this.v4.addCommand = this.addCommand.bind(this);
        (this as any).addCommand = (...args: Array<any>): this => {
            this.#multi.addCommand(transformLegacyCommandArguments(args));
            return this;
        };
        this.v4.exec = this.exec.bind(this);
        (this as any).exec = (callback?: (err: Error | null, replies?: Array<unknown>) => unknown): void => {
            this.v4.exec()
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

        for (const [ name, command ] of Object.entries(COMMANDS as RedisCommands)) {
            this.#defineLegacyCommand(name, command);
            (this as any)[name.toLowerCase()] ??= (this as any)[name];
        }
    }

    #defineLegacyCommand(this: any, name: string, command?: RedisCommand): void {
        this.v4[name] = this[name].bind(this.v4);
        this[name] = command && command.TRANSFORM_LEGACY_REPLY && command.transformReply ?
            (...args: Array<unknown>) => {
                this.#multi.addCommand(
                    [name, ...transformLegacyCommandArguments(args)],
                    command.transformReply
                );
                return this;
            } :
            (...args: Array<unknown>) => this.addCommand(name, ...args);
    }

    commandsExecutor(command: RedisCommand, args: Array<unknown>): this {
        return this.addCommand(
            command.transformArguments(...args),
            command.transformReply
        );
    }

    SELECT(db: number, transformReply?: RedisCommand['transformReply']): this {
        this.#selectedDB = db;
        return this.addCommand(['SELECT', db.toString()], transformReply);
    }

    select = this.SELECT;

    addCommand(args: RedisCommandArguments, transformReply?: RedisCommand['transformReply']): this {
        this.#multi.addCommand(args, transformReply);
        return this;
    }

    functionsExecutor(fn: RedisFunction, args: Array<unknown>, name: string): this {
        this.#multi.addFunction(name, fn, args);
        return this;
    }

    scriptsExecutor(script: RedisScript, args: Array<unknown>): this {
        this.#multi.addScript(script, args);
        return this;
    }

    async exec(execAsPipeline = false): Promise<Array<RedisCommandRawReply>> {
        if (execAsPipeline) {
            return this.execAsPipeline();
        }

        return this.#multi.handleExecReplies(
            await this.#executor(
                this.#multi.queue,
                this.#selectedDB,
                RedisMultiCommand.generateChainId()
            )
        );
    }

    EXEC = this.exec;

    async execAsPipeline(): Promise<Array<RedisCommandRawReply>> {
        if (this.#multi.queue.length === 0) return [];
        
        return this.#multi.transformReplies(
            await this.#executor(
                this.#multi.queue,
                this.#selectedDB
            )
        );
    }
}

attachCommands({
    BaseClass: RedisClientMultiCommand,
    commands: COMMANDS,
    executor: RedisClientMultiCommand.prototype.commandsExecutor
});
