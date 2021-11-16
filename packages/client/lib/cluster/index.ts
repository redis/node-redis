import COMMANDS from './commands';
import { RedisCommand, RedisCommandArguments, RedisCommandReply, RedisModules, RedisPlugins, RedisScript, RedisScripts } from '../commands';
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

export type RedisClusterType<M extends RedisModules = Record<string, never>, S extends RedisScripts = Record<string, never>> =
    RedisCluster<M, S> & WithCommands & WithModules<M> & WithScripts<S>;

export default class RedisCluster<M extends RedisModules = Record<string, never>, S extends RedisScripts = Record<string, never>> extends EventEmitter {
    static extractFirstKey(command: RedisCommand, originalArgs: Array<unknown>, redisArgs: RedisCommandArguments): string | Buffer | undefined {
        if (command.FIRST_KEY_INDEX === undefined) {
            return undefined;
        } else if (typeof command.FIRST_KEY_INDEX === 'number') {
            return redisArgs[command.FIRST_KEY_INDEX];
        }

        return command.FIRST_KEY_INDEX(...originalArgs);
    }

    static create<M extends RedisModules = Record<string, never>, S extends RedisScripts = Record<string, never>>(options?: RedisClusterOptions<M, S>): RedisClusterType<M, S> {
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
                options,
                command.BUFFER_MODE
            ),
            redisArgs.preserve
        );
    }

    async sendCommand<C extends RedisCommand>(
        firstKey: string | Buffer | undefined,
        isReadonly: boolean | undefined,
        args: RedisCommandArguments,
        options?: ClientCommandOptions,
        bufferMode?: boolean,
        redirections = 0
    ): Promise<RedisCommandReply<C>> {
        const client = this.#slots.getClient(firstKey, isReadonly);

        try {
            return await client.sendCommand(args, options, bufferMode);
        } catch (err: any) {
            const shouldRetry = await this.#handleCommandError(err, client, redirections);
            if (shouldRetry === true) {
                return this.sendCommand(firstKey, isReadonly, args, options, bufferMode, redirections + 1);
            } else if (shouldRetry) {
                return shouldRetry.sendCommand(args, options, bufferMode);
            }

            throw err;
        }
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
        options?: ClientCommandOptions,
        redirections = 0
    ): Promise<RedisCommandReply<typeof script>> {
        const client = this.#slots.getClient(
            RedisCluster.extractFirstKey(script, originalArgs, redisArgs),
            script.IS_READ_ONLY
        );

        try {
            return await client.executeScript(script, redisArgs, options, script.BUFFER_MODE);
        } catch (err: any) {
            const shouldRetry = await this.#handleCommandError(err, client, redirections);
            if (shouldRetry === true) {
                return this.executeScript(script, originalArgs, redisArgs, options, redirections + 1);
            } else if (shouldRetry) {
                return shouldRetry.executeScript(script, redisArgs, options, script.BUFFER_MODE);
            }

            throw err;
        }
    }

    async #handleCommandError(err: Error, client: RedisClientType<M, S>, redirections: number): Promise<boolean | RedisClientType<M, S>> {
        if (redirections > (this.#options.maxCommandRedirections ?? 16)) {
            throw err;
        }

        if (err.message.startsWith('ASK')) {
            const url = err.message.substring(err.message.lastIndexOf(' ') + 1);
            let node = this.#slots.getNodeByUrl(url);
            if (!node) {
                await this.#slots.discover(client);
                node = this.#slots.getNodeByUrl(url);

                if (!node) {
                    throw new Error(`Cannot find node ${url}`);
                }
            }

            await node.client.asking();
            return node.client;
        } else if (err.message.startsWith('MOVED')) {
            await this.#slots.discover(client);
            return true;
        }

        throw err;
    }

    multi(routing?: string | Buffer): RedisClusterMultiCommandType<M, S> {
        return new this.#Multi(
            async (commands: Array<RedisMultiQueuedCommand>, firstKey?: string | Buffer, chainId?: symbol) => {
                return this.#slots
                    .getClient(firstKey)
                    .multiExecutor(commands, chainId);
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
