import COMMANDS from './commands/cluster';
import { RedisCommand, RedisModule, RedisModules } from './commands';
import { RedisCommandSignature } from './client';
import { RedisSocketOptions } from './socket';
import RedisClusterSlots from './cluster-slots';

export interface RedisClusterOptions<M = RedisModules> {
    rootNodes: Array<RedisSocketOptions>;
    modules?: M;
    useReplicas?: boolean;
    maxCommandRedirections?: number;
}

type WithCommands = {
    [P in keyof typeof COMMANDS]: RedisCommandSignature<(typeof COMMANDS)[P]>
};

type WithModules<M extends Array<RedisModule>> = {
    [P in keyof M[number]]: RedisCommandSignature<M[number][P]>
};

export type RedisClusterType<M extends RedisModules> = WithCommands & WithModules<M> & RedisCluster;

export default class RedisCluster {
    static defineCommand(on: any, name: string, command: RedisCommand): void {
        on[name] = async function (...args: Array<unknown>): Promise<unknown> {
            const transformedArguments = command.transformArguments(...args);
            return command.transformReply(
                await this.sendCommand(
                    transformedArguments,
                    command.FIRST_KEY_INDEX,
                    command.IS_READ_ONLY
                )
            );
        };
    }

    static create<M extends RedisModules>(options: RedisClusterOptions): RedisClusterType<M> {
        return <any>new RedisCluster(options);
    }

    readonly #options: RedisClusterOptions;
    readonly #slots: RedisClusterSlots;

    constructor(options: RedisClusterOptions) {
        this.#options = options;
        this.#slots = new RedisClusterSlots(options);
    }

    async connect(): Promise<void> {
        return this.#slots.connect();
    }

    async sendCommand<T = unknown>(args: Array<string>, firstKeyIndex?: number, isReadOnly?: boolean, redirections: number = 0): Promise<T> {
        const firstKey = firstKeyIndex ? args[firstKeyIndex] : undefined,
            client = this.#slots.getClient(firstKey, isReadOnly);

        try {
            return await client.sendCommand(args);
        } catch (err) {
            if (err.message.startsWith('ASK')) {
                // TODO
            } else if (err.message.startsWith('MOVED')) {
                await this.#slots.discover();

                if (redirections < (this.#options.maxCommandRedirections ?? 16)) {
                    return this.sendCommand(args, firstKeyIndex, isReadOnly, redirections + 1);
                }
            }

            throw err;
        }
    }

    disconnect(): Promise<void> {
        return this.#slots.disconnect();
    }
}

for (const [name, command] of Object.entries(COMMANDS)) {
    RedisCluster.defineCommand(RedisCluster.prototype, name, command);
}
