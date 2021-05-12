import calculateSlot from 'cluster-key-slot';
import COMMANDS from './commands/cluster.js';
import { RedisCommand, RedisModule, RedisModules } from './commands/index.js';
import { RedisCommandSignature } from './client.js';
import { RedisSocketOptions } from './socket.js';
import RedisClusterSlots from './cluster-slots.js';

export interface RedisClusterOptions<M = RedisModules> {
    rootNodes: Array<RedisSocketOptions>;
    modules?: M;
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
                    command.FIRST_KEY_INDEX
                )
            );
        };
    }

    static create<M extends RedisModules>(options: RedisClusterOptions): RedisClusterType<M> {
        return <any>new RedisCluster(options);
    }

    readonly #slots: RedisClusterSlots;

    constructor(options: RedisClusterOptions) {
        this.#slots = new RedisClusterSlots(options);
    }

    async connect(): Promise<void> {
        return this.#slots.connect();
    }

    sendCommand<T = unknown>(args: Array<string>, firstKeyIndex?: number): Promise<T> {
        const firstKey = firstKeyIndex ? args[firstKeyIndex] : undefined;
        return this.#slots.getClient(firstKey)
            .sendCommand(args);
    }

    disconnect(): Promise<void> {
        return this.#slots.disconnect();
    }
}

for (const [name, command] of Object.entries(COMMANDS)) {
    RedisCluster.defineCommand(RedisCluster.prototype, name, command);
}
