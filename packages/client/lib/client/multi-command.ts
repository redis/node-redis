import COMMANDS from './commands';
import { RedisCommand, RedisCommandArguments, RedisCommandRawReply, RedisModules, RedisPlugins, RedisScript, RedisScripts } from '../commands';
import RedisMultiCommand, { RedisMultiQueuedCommand } from '../multi-command';
import { extendWithCommands, extendWithModulesAndScripts, LegacyCommandArguments, transformLegacyCommandArguments } from '../commander';

type RedisClientMultiCommandSignature<C extends RedisCommand, M extends RedisModules, S extends RedisScripts> =
    (...args: Parameters<C['transformArguments']>) => RedisClientMultiCommandType<M, S>;

type WithCommands<M extends RedisModules, S extends RedisScripts> = {
    [P in keyof typeof COMMANDS]: RedisClientMultiCommandSignature<(typeof COMMANDS)[P], M, S>
};

type WithModules<M extends RedisModules, S extends RedisScripts> = {
    [P in keyof M as M[P] extends never ? never : P]: {
        [C in keyof M[P]]: RedisClientMultiCommandSignature<M[P][C], M, S>;
    };
};

type WithScripts<M extends RedisModules, S extends RedisScripts> = {
    [P in keyof S as S[P] extends never ? never : P]: RedisClientMultiCommandSignature<S[P], M, S>
};

export type RedisClientMultiCommandType<M extends RedisModules = Record<string, never>, S extends RedisScripts = Record<string, never>> =
    RedisClientMultiCommand & WithCommands<M, S> & WithModules<M, S> & WithScripts<M, S>;

export type RedisClientMultiExecutor = (queue: Array<RedisMultiQueuedCommand>, chainId?: symbol) => Promise<Array<RedisCommandRawReply>>;

export default class RedisClientMultiCommand {
    readonly #multi = new RedisMultiCommand();
    readonly #executor: RedisClientMultiExecutor;

    static extend<M extends RedisModules, S extends RedisScripts>(
        plugins?: RedisPlugins<M, S>
    ): new (...args: ConstructorParameters<typeof RedisMultiCommand>) => RedisClientMultiCommandType<M, S> {
        return <any>extendWithModulesAndScripts({
            BaseClass: RedisClientMultiCommand,
            modules: plugins?.modules,
            modulesCommandsExecutor: RedisClientMultiCommand.prototype.commandsExecutor,
            scripts: plugins?.scripts,
            scriptsExecutor: RedisClientMultiCommand.prototype.scriptsExecutor
        });
    }

    readonly v4: Record<string, any> = {};

    constructor(executor: RedisClientMultiExecutor, legacyMode = false) {
        this.#executor = executor;
        if (legacyMode) {
            this.#legacyMode();
        }
    }

    #legacyMode(): void {
        this.v4.addCommand = this.addCommand.bind(this);
        (this as any).addCommand = (...args: LegacyCommandArguments): this => {
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

        for (const name of Object.keys(COMMANDS)) {
            this.#defineLegacyCommand(name);
        }
    }

    #defineLegacyCommand(name: string): void {
        (this as any).v4[name] = (this as any)[name].bind(this.v4);
        (this as any)[name] = (...args: Array<unknown>): void => (this as any).addCommand(name, args);
    }

    commandsExecutor(command: RedisCommand, args: Array<unknown>): this {
        return this.addCommand(
            command.transformArguments(...args),
            command.transformReply
        );
    }

    addCommand(args: RedisCommandArguments, transformReply?: RedisCommand['transformReply']): this {
        this.#multi.addCommand(args, transformReply);
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

        const commands = this.#multi.exec();
        if (!commands) return [];

        return this.#multi.handleExecReplies(
            await this.#executor(commands, RedisMultiCommand.generateChainId())
        );
    }

    EXEC = this.exec;

    async execAsPipeline(): Promise<Array<RedisCommandRawReply>> {
        if (!this.#multi.queue.length) return [];

        return this.#multi.transformReplies(
            await this.#executor(this.#multi.queue)
        );
    }
}

extendWithCommands({
    BaseClass: RedisClientMultiCommand,
    commands: COMMANDS,
    executor: RedisClientMultiCommand.prototype.commandsExecutor
});
