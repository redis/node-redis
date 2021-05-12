import calculateSlot from 'cluster-key-slot';
import RedisClient from './client';
import { RedisSocketOptions } from './socket';
import { RedisClusterNode } from './commands/CLUSTER_NODES';
import { RedisClusterOptions } from './cluster';

export default class RedisClusterSlots {
    readonly #options: RedisClusterOptions;
    readonly #clientByKey = new Map<string, RedisClient>();
    readonly #slots: Array<RedisClient> = [];

    constructor(options: RedisClusterOptions) {
        this.#options = options;
    }

    async connect(): Promise<void> {
        // TODO: if connected use a random client?
        for (const rootNode of this.#options.rootNodes) {
            try {
                await this.#discoverNodes(rootNode);
            } catch (err) {
                // this.emit('error', err);
            }
        }

        throw new Error('None of the root nodes was available');
    }

    async #discoverNodes(socketOptions: RedisSocketOptions) {
        const client = RedisClient.create({
            socket: socketOptions,
            modules: this.#options?.modules
        });

        await client.connect();

        try {
            await this.#reset(await client.clusterNodes());
        } finally {
            await client.disconnect(); // TODO: catch error from disconnect?
        }
    }

    async #reset(nodes: Array<RedisClusterNode>): Promise<void> {
        // Override this.#slots and add not existing clients to this.#clientByKey
        const promises = [],
            clientsInUse = new Set();
        for (const {url, slots} of nodes) {
            clientsInUse.add(url);

            let client = this.#clientByKey.get(url);
            if (!client) {
                // TODO: client configuration
                client = RedisClient.create();
                promises.push(client.connect());
            }

            for (const slot of slots) {
                for (let i = slot.from; i < slot.to; i++) {
                    this.#slots[i] = client;
                }
            }
        }

        // Remove unused clients from this.#clientBykey using clientsInUse
        for (const [key, client] of this.#clientByKey.entries()) {
            if (clientsInUse.has(key)) continue;

            // TODO: ignore error from `.disconnect`?
            promises.push(client.disconnect());
            this.#clientByKey.delete(key);
        }
    }

    #getSlotClient(slot: number): RedisClient {
        return this.#slots[slot];
    }

    #randomClientIterator?: IterableIterator<RedisClient>;

    #getRandomClient(): RedisClient {
        if (!this.#clientByKey.size) {
            throw new Error('Cluster is not connected');
        }

        if (!this.#randomClientIterator) {
            this.#randomClientIterator = this.#clientByKey.values();
        }

        const {done, value} = this.#randomClientIterator.next();
        if (done) {
            this.#randomClientIterator = undefined;
            return this.#getRandomClient();
        }

        return value;
    }

    getClient(firstKey?: string): RedisClient {
        if (!firstKey) {
            return this.#getRandomClient();
        }

        return this.#getSlotClient(calculateSlot(firstKey));
    }

    async disconnect(): Promise<void> {
        await Promise.all(
            [...this.#clientByKey.values()].map(client => client.disconnect())
        );
    }
}
