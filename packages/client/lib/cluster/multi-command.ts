import COMMANDS from './commands';
import { RedisCommand, RedisCommandArguments, RedisCommandRawReply, RedisModules, RedisPlugins, RedisScript, RedisScripts } from '../commands';
import RedisMultiCommand, { RedisMultiQueuedCommand } from '../multi-command';
import { extendWithCommands, extendWithModulesAndScripts } from '../commander';
import RedisCluster from '.';

type RedisClusterMultiCommandSignature<C extends RedisCommand, M extends RedisModules, S extends RedisScripts> =
    (...args: Parameters<C['transformArguments']>) => RedisClusterMultiCommandType<M, S>;

type WithCommands<M extends RedisModules, S extends RedisScripts> = {
    [P in keyof typeof COMMANDS]: RedisClusterMultiCommandSignature<(typeof COMMANDS)[P], M, S>
};

type WithModules<M extends RedisModules, S extends RedisScripts> = {
    [P in keyof M as M[P] extends never ? never : P]: {
        [C in keyof M[P]]: RedisClusterMultiCommandSignature<M[P][C], M, S>;
    };
};

type WithScripts<M extends RedisModules, S extends RedisScripts> = {
    [P in keyof S as S[P] extends never ? never : P]: RedisClusterMultiCommandSignature<S[P], M, S>
};

export type RedisClusterMultiCommandType<M extends RedisModules = Record<string, never>, S extends RedisScripts = Record<string, never>> =
    RedisClusterMultiCommand & WithCommands<M, S> & WithModules<M, S> & WithScripts<M, S>;

export type RedisClusterMultiExecutor = (queue: Array<RedisMultiQueuedCommand>, firstKey?: string | Buffer, chainId?: symbol) => Promise<Array<RedisCommandRawReply>>;

export default class RedisClusterMultiCommand {
    readonly #multi = new RedisMultiCommand();
    readonly #executor: RedisClusterMultiExecutor;
    #firstKey: string | Buffer | undefined;

    static extend<M extends RedisModules, S extends RedisScripts>(
        plugins?: RedisPlugins<M, S>
    ): new (...args: ConstructorParameters<typeof RedisMultiCommand>) => RedisClusterMultiCommandType<M, S> {
        return <any>extendWithModulesAndScripts({
            BaseClass: RedisClusterMultiCommand,
            modules: plugins?.modules,
            modulesCommandsExecutor: RedisClusterMultiCommand.prototype.commandsExecutor,
            scripts: plugins?.scripts,
            scriptsExecutor: RedisClusterMultiCommand.prototype.scriptsExecutor
        });
    }

    constructor(executor: RedisClusterMultiExecutor, firstKey?: string | Buffer) {
        this.#executor = executor;
        this.#firstKey = firstKey;
    }

    commandsExecutor(command: RedisCommand, args: Array<unknown>): this {
        const transformedArguments = command.transformArguments(...args);
        if (!this.#firstKey) {
            this.#firstKey = RedisCluster.extractFirstKey(command, args, transformedArguments);
        }

        return this.addCommand(
            undefined,
            transformedArguments,
            command.transformReply
        );
    }

    addCommand(
        firstKey: string | Buffer | undefined,
        args: RedisCommandArguments,
        transformReply?: RedisCommand['transformReply']
    ): this {
        if (!this.#firstKey) {
            this.#firstKey = firstKey;
        }

        this.#multi.addCommand(args, transformReply);
        return this;
    }

    scriptsExecutor(script: RedisScript, args: Array<unknown>): this {
        const transformedArguments = this.#multi.addScript(script, args);
        if (!this.#firstKey) {
            this.#firstKey = RedisCluster.extractFirstKey(script, args, transformedArguments);
        }

        return this.addCommand(undefined, transformedArguments);
    }

    async exec(execAsPipeline = false): Promise<Array<RedisCommandRawReply>> {
        if (execAsPipeline) {
            return this.execAsPipeline();
        }

        const commands = this.#multi.exec();
        if (!commands) return [];

        return this.#multi.handleExecReplies(
            await this.#executor(commands, this.#firstKey, RedisMultiCommand.generateChainId())
        );
    }

    EXEC = this.exec;

    async execAsPipeline(): Promise<Array<RedisCommandRawReply>> {
        return this.#multi.transformReplies(
            await this.#executor(this.#multi.queue, this.#firstKey)
        );
    }
}

extendWithCommands({
    BaseClass: RedisClusterMultiCommand,
    commands: COMMANDS,
    executor: RedisClusterMultiCommand.prototype.commandsExecutor
});
