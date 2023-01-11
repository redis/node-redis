import COMMANDS from './commands';
import { RedisCommand, RedisCommandArgument, RedisCommandArguments, RedisCommandRawReply, RedisCommandReply, RedisFunctions, RedisModules, RedisExtensions, RedisScript, RedisScripts, RedisCommandSignature, RedisFunction } from '../commands';
import { ClientCommandOptions, RedisClientOptions, RedisClientType, WithFunctions, WithModules, WithScripts } from '../client';
import RedisClusterSlots, { NodeAddressMap, ShardNode } from './cluster-slots';
import { attachExtensions, transformCommandReply, attachCommands, transformCommandArguments } from '../commander';
import { EventEmitter } from 'events';
import RedisClusterMultiCommand, { InstantiableRedisClusterMultiCommandType, RedisClusterMultiCommandType } from './multi-command';
import { RedisMultiQueuedCommand } from '../multi-command';
import { PubSubListener } from '../client/pub-sub';
import { ErrorReply } from '../errors';

export type RedisClusterClientOptions = Omit<
    RedisClientOptions,
    'modules' | 'functions' | 'scripts' | 'database'
>;

export interface RedisClusterOptions<
    M extends RedisModules = Record<string, never>,
    F extends RedisFunctions = Record<string, never>,
    S extends RedisScripts = Record<string, never>
> extends RedisExtensions<M, F, S> {
    /**
     * Some of the cluster nodes to discover the cluster topology
     * There is no reason to add all the nodes in the cluster, 3 nodes is a good practice
     */
    rootNodes: Array<RedisClusterClientOptions>;
    /**
     * The defaults for every client in the cluster
     */
    defaults?: Partial<RedisClusterClientOptions>;
    /**
     * If true, the cluster will connect to nodes on use rather then on connect
     */
    minimizeConnections?: boolean;
    /**
     * If true, the cluster will use replicas for read-only commands
     */
    useReplicas?: boolean;
    /**
     * The maximum number of redirections (ASK/MOVED) to follow before throwing an error
     */
    maxCommandRedirections?: number;
    /**
     * Mapping bettwen the addresses in the cluster (see `CLUSTER SLOTS`) and the addresses the client should connect to
     * Useful when the cluster is running on another network
     */
    nodeAddressMap?: NodeAddressMap;
}

type WithCommands = {
    [P in keyof typeof COMMANDS]: RedisCommandSignature<(typeof COMMANDS)[P]>;
};

export type RedisClusterType<
    M extends RedisModules = Record<string, never>,
    F extends RedisFunctions = Record<string, never>,
    S extends RedisScripts = Record<string, never>
> = RedisCluster<M, F, S> & WithCommands & WithModules<M> & WithFunctions<F> & WithScripts<S>;

export default class RedisCluster<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> extends EventEmitter {
    static extractFirstKey(
        command: RedisCommand,
        originalArgs: Array<unknown>,
        redisArgs: RedisCommandArguments
    ): RedisCommandArgument | undefined {
        if (command.FIRST_KEY_INDEX === undefined) {
            return undefined;
        } else if (typeof command.FIRST_KEY_INDEX === 'number') {
            return redisArgs[command.FIRST_KEY_INDEX];
        }

        return command.FIRST_KEY_INDEX(...originalArgs);
    }

    static create<
        M extends RedisModules,
        F extends RedisFunctions,
        S extends RedisScripts
    >(options?: RedisClusterOptions<M, F, S>): RedisClusterType<M, F, S> {
        return new (attachExtensions({
            BaseClass: RedisCluster,
            modulesExecutor: RedisCluster.prototype.commandsExecutor,
            modules: options?.modules,
            functionsExecutor: RedisCluster.prototype.functionsExecutor,
            functions: options?.functions,
            scriptsExecutor: RedisCluster.prototype.scriptsExecutor,
            scripts: options?.scripts
        }))(options);
    }

    readonly #options: RedisClusterOptions<M, F, S>;

    readonly #slots: RedisClusterSlots<M, F, S>;
    
    get slots() {
        return this.#slots.slots;
    }

    get shards() {
        return this.#slots.shards;
    }

    get masters() {
        return this.#slots.masters;
    }

    get replicas() {
        return this.#slots.replicas;
    }

    get nodeByAddress() {
        return this.#slots.nodeByAddress;
    }

    get pubSubNode() {
        return this.#slots.pubSubNode;
    }

    readonly #Multi: InstantiableRedisClusterMultiCommandType<M, F, S>;

    get isOpen() {
        return this.#slots.isOpen;
    }

    constructor(options: RedisClusterOptions<M, F, S>) {
        super();

        this.#options = options;
        this.#slots = new RedisClusterSlots(options, this.emit.bind(this));
        this.#Multi = RedisClusterMultiCommand.extend(options);
    }

    duplicate(overrides?: Partial<RedisClusterOptions<M, F, S>>): RedisClusterType<M, F, S> {
        return new (Object.getPrototypeOf(this).constructor)({
            ...this.#options,
            ...overrides
        });
    }

    connect() {
        return this.#slots.connect();
    }

    async commandsExecutor<C extends RedisCommand>(
        command: C,
        args: Array<unknown>
    ): Promise<RedisCommandReply<C>> {
        const { args: redisArgs, options } = transformCommandArguments(command, args);
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

    async functionsExecutor<F extends RedisFunction>(
        fn: F,
        args: Array<unknown>,
        name: string,
    ): Promise<RedisCommandReply<F>> {
        const { args: redisArgs, options } = transformCommandArguments(fn, args);
        return transformCommandReply(
            fn,
            await this.executeFunction(
                name,
                fn,
                args,
                redisArgs,
                options
            ),
            redisArgs.preserve
        );
    }

    async executeFunction(
        name: string,
        fn: RedisFunction,
        originalArgs: Array<unknown>,
        redisArgs: RedisCommandArguments,
        options?: ClientCommandOptions
    ): Promise<RedisCommandRawReply> {
        return this.#execute(
            RedisCluster.extractFirstKey(fn, originalArgs, redisArgs),
            fn.IS_READ_ONLY,
            client => client.executeFunction(name, fn, redisArgs, options)
        );
    }

    async scriptsExecutor<S extends RedisScript>(script: S, args: Array<unknown>): Promise<RedisCommandReply<S>> {
        const { args: redisArgs, options } = transformCommandArguments(script, args);
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
    ): Promise<RedisCommandRawReply> {
        return this.#execute(
            RedisCluster.extractFirstKey(script, originalArgs, redisArgs),
            script.IS_READ_ONLY,
            client => client.executeScript(script, redisArgs, options)
        );
    }

    async #execute<Reply>(
        firstKey: RedisCommandArgument | undefined,
        isReadonly: boolean | undefined,
        executor: (client: RedisClientType<M, F, S>) => Promise<Reply>
    ): Promise<Reply> {
        const maxCommandRedirections = this.#options.maxCommandRedirections ?? 16;
        let client = await this.#slots.getClient(firstKey, isReadonly);
        for (let i = 0;; i++) {
            try {
                return await executor(client);
            } catch (err) {
                if (++i > maxCommandRedirections || !(err instanceof ErrorReply)) {
                    throw err;
                }

                if (err.message.startsWith('ASK')) {
                    const address = err.message.substring(err.message.lastIndexOf(' ') + 1);
                    let redirectTo = await this.#slots.getMasterByAddress(address);
                    if (!redirectTo) {
                        await this.#slots.rediscover(client);
                        redirectTo = await this.#slots.getMasterByAddress(address);
                    }

                    if (!redirectTo) {
                        throw new Error(`Cannot find node ${address}`);
                    }

                    await redirectTo.asking();
                    client = redirectTo;
                    continue;
                } else if (err.message.startsWith('MOVED')) {
                    await this.#slots.rediscover(client);
                    client = await this.#slots.getClient(firstKey, isReadonly);
                    continue;
                }

                throw err;
            }
        }
    }

    MULTI(routing?: RedisCommandArgument): RedisClusterMultiCommandType<M, F, S> {
        return new this.#Multi(
            (commands: Array<RedisMultiQueuedCommand>, firstKey?: RedisCommandArgument, chainId?: symbol) => {
                return this.#execute(
                    firstKey,
                    false,
                    client => client.multiExecutor(commands, undefined, chainId)
                );
            },
            routing
        );
    }

    multi = this.MULTI;

    async SUBSCRIBE<T extends boolean = false>(
        channels: string | Array<string>,
        listener: PubSubListener<T>,
        bufferMode?: T
    ) {
        return (await this.#slots.getPubSubClient())
            .SUBSCRIBE(channels, listener, bufferMode);
    }

    subscribe = this.SUBSCRIBE;

    async UNSUBSCRIBE<T extends boolean = false>(
        channels?: string | Array<string>,
        listener?: PubSubListener<boolean>,
        bufferMode?: T
    ) {
        const client = await this.#slots.getPubSubClient(),
            reply = await client.UNSUBSCRIBE(channels, listener, bufferMode)

        if (!client.isPubSubActive) {
            // TODO: await?
            await client.disconnect();
        }

        return reply;
    }

    unsubscribe = this.UNSUBSCRIBE;

    async PSUBSCRIBE<T extends boolean = false>(
        channels: string | Array<string>,
        listener: PubSubListener<T>,
        bufferMode?: T
    ) {
        return (await this.#slots.getPubSubClient())
            .PSUBSCRIBE(channels, listener, bufferMode);
    }

    pSubscribe = this.PSUBSCRIBE;

    async PUNSUBSCRIBE<T extends boolean = false>(
        channels?: string | Array<string>,
        listener?: PubSubListener<T>,
        bufferMode?: T
    ) {
        return (await this.#slots.getPubSubClient())
            .PUNSUBSCRIBE(channels, listener, bufferMode);
    }

    pUnsubscribe = this.PUNSUBSCRIBE;

    // SSUBSCRIBE<T extends boolean>(
    //     channels: string | Array<string>,
    //     listener: PubSubListener<T>,
    //     bufferMode?: T
    // ) {
        
    // }

    // SUNSUBSCRIBE() {

    // }

    quit(): Promise<void> {
        return this.#slots.quit();
    }

    disconnect(): Promise<void> {
        return this.#slots.disconnect();
    }

    nodeClient(node: ShardNode<M, F, S>) {
        return this.#slots.nodeClient(node); 
    }

    getRandomNode() {
        return this.#slots.getRandomNode();
    }

    getSlotRandomNode(slot: number) {
        return this.#slots.getSlotRandomNode(slot);
    }
}

attachCommands({
    BaseClass: RedisCluster,
    commands: COMMANDS,
    executor: RedisCluster.prototype.commandsExecutor
});
