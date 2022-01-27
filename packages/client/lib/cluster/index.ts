import COMMANDS from './commands';
import { RedisCommand, RedisCommandArgument, RedisCommandArguments, RedisCommandRawReply, RedisCommandReply, RedisModules, RedisPlugins, RedisScript, RedisScripts } from '../commands';
import { ClientCommandOptions, RedisClientCommandSignature, RedisClientOptions, RedisClientType, WithModules, WithScripts } from '../client';
import RedisClusterSlots, { ClusterNode } from './cluster-slots';
import { extendWithModulesAndScripts, transformCommandArguments, transformCommandReply, extendWithCommands } from '../commander';
import { EventEmitter } from 'events';
import RedisClusterMultiCommand, { RedisClusterMultiCommandType } from './multi-command';
import { RedisMultiQueuedCommand } from '../multi-command';

export type RedisClusterClientOptions = Omit<RedisClientOptions<Record<string, never>, Record<string, never>>, 'modules' | 'scripts'>;

export interface RedisClusterOptions<M extends RedisModules, S extends RedisScripts> extends RedisPlugins<M, S> {
    rootNodes: Array<RedisClusterClientOptions>;
    defaults?: Partial<RedisClusterClientOptions>;
    useReplicas?: boolean;
    maxCommandRedirections?: number;
}

type WithCommands = {
    [P in keyof typeof COMMANDS]: RedisClientCommandSignature<(typeof COMMANDS)[P]>;
};

export type RedisClusterType<M extends RedisModules, S extends RedisScripts> =
    RedisCluster<M, S> & WithCommands & WithModules<M> & WithScripts<S>;

export default class RedisCluster<M extends RedisModules, S extends RedisScripts> extends EventEmitter {
    static extractFirstKey(command: RedisCommand, originalArgs: Array<unknown>, redisArgs: RedisCommandArguments): RedisCommandArgument | undefined {
        if (command.FIRST_KEY_INDEX === undefined) {
            return undefined;
        } else if (typeof command.FIRST_KEY_INDEX === 'number') {
            return redisArgs[command.FIRST_KEY_INDEX];
        }

        return command.FIRST_KEY_INDEX(...originalArgs);
    }

    static create<M extends RedisModules, S extends RedisScripts>(options?: RedisClusterOptions<M, S>): RedisClusterType<M, S> {
        return new (<any>extendWithModulesAndScripts({
            BaseClass: RedisCluster,
            modules: options?.modules,
            modulesCommandsExecutor: RedisCluster.prototype.commandsExecutor,
            scripts: options?.scripts,
            scriptsExecutor: RedisCluster.prototype.scriptsExecutor
        }))(options);
    }

    readonly #options: RedisClusterOptions<M, S>;
    readonly #slots: RedisClusterSlots<M, S>;
    readonly #Multi: new (...args: ConstructorParameters<typeof RedisClusterMultiCommand>) => RedisClusterMultiCommandType<M, S>;

    constructor(options: RedisClusterOptions<M, S>) {
        super();

        this.#options = options;
        this.#slots = new RedisClusterSlots(options, err => this.emit('error', err));
        this.#Multi = RedisClusterMultiCommand.extend(options);
    }

    duplicate(overrides?: Partial<RedisClusterOptions<M, S>>): RedisClusterType<M, S> {
        return new (Object.getPrototypeOf(this).constructor)({
            ...this.#options,
            ...overrides
        });
    }

    async connect(): Promise<void> {
        return this.#slots.connect();
    }

    async commandsExecutor(command: RedisCommand, args: Array<unknown>): Promise<RedisCommandReply<typeof command>> {
        const { args: redisArgs, options } = transformCommandArguments<ClientCommandOptions>(command, args);

        return transformCommandReply(
            command,
            await this.sendCommand(
                RedisCluster.extractFirstKey(command, args, redisArgs),
                command.IS_READ_ONLY,
                redisArgs,
                options
            ),
            redisArgs.preserve
        );
    }

    async sendCommand<T = RedisCommandRawReply>(
        firstKey: RedisCommandArgument | undefined,
        isReadonly: boolean | undefined,
        args: RedisCommandArguments,
        options?: ClientCommandOptions
    ): Promise<T> {
        return this.#execute(
            firstKey,
            isReadonly,
            client => client.sendCommand<T>(args, options)
        );
    }

    async scriptsExecutor(script: RedisScript, args: Array<unknown>): Promise<RedisCommandReply<typeof script>> {
        const { args: redisArgs, options } = transformCommandArguments<ClientCommandOptions>(script, args);

        return transformCommandReply(
            script,
            await this.executeScript(
                script,
                args,
                redisArgs,
                options
            ),
            redisArgs.preserve
        );
    }

    async executeScript(
        script: RedisScript,
        originalArgs: Array<unknown>,
        redisArgs: RedisCommandArguments,
        options?: ClientCommandOptions
    ): Promise<RedisCommandReply<typeof script>> {
        return this.#execute(
            RedisCluster.extractFirstKey(script, originalArgs, redisArgs),
            script.IS_READ_ONLY,
            client => client.executeScript(script, redisArgs, options)
        );
    }

    async #execute<Reply>(
        firstKey: RedisCommandArgument | undefined,
        isReadonly: boolean | undefined,
        executor: (client: RedisClientType<M, S>) => Promise<Reply>
    ): Promise<Reply> {
        const maxCommandRedirections = this.#options.maxCommandRedirections ?? 16;
        let client = this.#slots.getClient(firstKey, isReadonly);
        for (let i = 0;; i++) {
            try {
                return await executor(client);
            } catch (err) {
                if (++i > maxCommandRedirections || !(err instanceof Error)) {
                    throw err;
                }

                if (err.message.startsWith('ASK')) {
                    const url = err.message.substring(err.message.lastIndexOf(' ') + 1);
                    if (this.#slots.getNodeByUrl(url)?.client === client) {
                        await client.asking();
                        continue;
                    }

                    await this.#slots.rediscover(client);
                    const redirectTo = this.#slots.getNodeByUrl(url);
                    if (!redirectTo) {
                        throw new Error(`Cannot find node ${url}`);
                    }

                    await redirectTo.client.asking();
                    client = redirectTo.client;
                    continue;
                } else if (err.message.startsWith('MOVED')) {
                    await this.#slots.rediscover(client);
                    client = this.#slots.getClient(firstKey, isReadonly);
                    continue;
                }

                throw err;
            }
        }
    }

    multi(routing?: RedisCommandArgument): RedisClusterMultiCommandType<M, S> {
        return new this.#Multi(
            (commands: Array<RedisMultiQueuedCommand>, firstKey?: RedisCommandArgument, chainId?: symbol) => {
                return this.#execute(
                    firstKey,
                    false,
                    client => client.multiExecutor(commands, chainId)
                );
            },
            routing
        );
    }

    getMasters(): Array<ClusterNode<M, S>> {
        return this.#slots.getMasters();
    }

    getSlotMaster(slot: number): ClusterNode<M, S> {
        return this.#slots.getSlotMaster(slot);
    }

    disconnect(): Promise<void> {
        return this.#slots.disconnect();
    }
}

extendWithCommands({
    BaseClass: RedisCluster,
    commands: COMMANDS,
    executor: RedisCluster.prototype.commandsExecutor
});
