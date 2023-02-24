import COMMANDS from './commands';
import { RedisCommand, RedisCommandArgument, RedisCommandArguments, RedisCommandRawReply, RedisFunctions, RedisModules, RedisExtensions, RedisScript, RedisScripts, ExcludeMappedString, RedisFunction } from '../commands';
import RedisMultiCommand, { RedisMultiQueuedCommand } from '../multi-command';
import { attachCommands, attachExtensions } from '../commander';
import RedisCluster from '.';

type RedisClusterMultiCommandSignature<
    C extends RedisCommand,
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = (...args: Parameters<C['transformArguments']>) => RedisClusterMultiCommandType<M, F, S>;

type WithCommands<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = {
    [P in keyof typeof COMMANDS]: RedisClusterMultiCommandSignature<(typeof COMMANDS)[P], M, F, S>;
};

type WithModules<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = {
    [P in keyof M as ExcludeMappedString<P>]: {
        [C in keyof M[P] as ExcludeMappedString<C>]: RedisClusterMultiCommandSignature<M[P][C], M, F, S>;
    };
};

type WithFunctions<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = {
    [P in keyof F as ExcludeMappedString<P>]: {
        [FF in keyof F[P] as ExcludeMappedString<FF>]: RedisClusterMultiCommandSignature<F[P][FF], M, F, S>;
    };
};

type WithScripts<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = {
    [P in keyof S as ExcludeMappedString<P>]: RedisClusterMultiCommandSignature<S[P], M, F, S>;
};

export type RedisClusterMultiCommandType<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = RedisClusterMultiCommand & WithCommands<M, F, S> & WithModules<M, F, S> & WithFunctions<M, F, S> & WithScripts<M, F, S>;

export type InstantiableRedisClusterMultiCommandType<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> = new (...args: ConstructorParameters<typeof RedisClusterMultiCommand>) => RedisClusterMultiCommandType<M, F, S>;

export type RedisClusterMultiExecutor = (queue: Array<RedisMultiQueuedCommand>, firstKey?: RedisCommandArgument, chainId?: symbol) => Promise<Array<RedisCommandRawReply>>;

export default class RedisClusterMultiCommand {
    readonly #multi = new RedisMultiCommand();
    readonly #executor: RedisClusterMultiExecutor;
    #firstKey: RedisCommandArgument | undefined;

    static extend<
        M extends RedisModules,
        F extends RedisFunctions,
        S extends RedisScripts
    >(extensions?: RedisExtensions<M, F, S>): InstantiableRedisClusterMultiCommandType<M, F, S> {
        return attachExtensions({
            BaseClass: RedisClusterMultiCommand,
            modulesExecutor: RedisClusterMultiCommand.prototype.commandsExecutor,
            modules: extensions?.modules,
            functionsExecutor: RedisClusterMultiCommand.prototype.functionsExecutor,
            functions: extensions?.functions,
            scriptsExecutor: RedisClusterMultiCommand.prototype.scriptsExecutor,
            scripts: extensions?.scripts
        });
    }

    constructor(executor: RedisClusterMultiExecutor, firstKey?: RedisCommandArgument) {
        this.#executor = executor;
        this.#firstKey = firstKey;
    }

    commandsExecutor(command: RedisCommand, args: Array<unknown>): this {
        const transformedArguments = command.transformArguments(...args);
        this.#firstKey ??= RedisCluster.extractFirstKey(command, args, transformedArguments);
        return this.addCommand(undefined, transformedArguments, command.transformReply);
    }

    addCommand(
        firstKey: RedisCommandArgument | undefined,
        args: RedisCommandArguments,
        transformReply?: RedisCommand['transformReply']
    ): this {
        this.#firstKey ??= firstKey;
        this.#multi.addCommand(args, transformReply);
        return this;
    }

    functionsExecutor(fn: RedisFunction, args: Array<unknown>, name: string): this {
        const transformedArguments = this.#multi.addFunction(name, fn, args);
        this.#firstKey ??= RedisCluster.extractFirstKey(fn, args, transformedArguments);
        return this;
    }

    scriptsExecutor(script: RedisScript, args: Array<unknown>): this {
        const transformedArguments = this.#multi.addScript(script, args);
        this.#firstKey ??= RedisCluster.extractFirstKey(script, args, transformedArguments);
        return this;
    }

    async exec(execAsPipeline = false): Promise<Array<RedisCommandRawReply>> {
        if (execAsPipeline) {
            return this.execAsPipeline();
        }

        return this.#multi.handleExecReplies(
            await this.#executor(this.#multi.queue, this.#firstKey, RedisMultiCommand.generateChainId())
        );
    }

    EXEC = this.exec;

    async execAsPipeline(): Promise<Array<RedisCommandRawReply>> {
        return this.#multi.transformReplies(
            await this.#executor(this.#multi.queue, this.#firstKey)
        );
    }
}

attachCommands({
    BaseClass: RedisClusterMultiCommand,
    commands: COMMANDS,
    executor: RedisClusterMultiCommand.prototype.commandsExecutor
});
