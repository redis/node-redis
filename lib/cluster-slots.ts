import calculateSlot from 'cluster-key-slot';
import RedisClient from './client';
import { RedisSocketOptions } from './socket';
import { RedisClusterMasterNode, RedisClusterReplicaNode } from './commands/CLUSTER_NODES';
import { RedisClusterOptions } from './cluster';

interface SlotClients {
    master: RedisClient;
    replicas: Array<RedisClient>;
    iterator: IterableIterator<RedisClient> | undefined;
}

export default class RedisClusterSlots {
    readonly #options: RedisClusterOptions;
    readonly #clientByKey = new Map<string, RedisClient>();
    readonly #slots: Array<SlotClients> = [];

    constructor(options: RedisClusterOptions) {
        this.#options = options;
    }

    async connect(): Promise<void> {
        for (const rootNode of this.#options.rootNodes) {
            try {
                await this.#discoverNodes(rootNode);
                return;
            } catch (err) {
                // this.emit('error', err);
            }
        }

        throw new Error('None of the root nodes is available');
    }

    async discover(startWith: RedisClient): Promise<void> {
        try {
            await this.#discoverNodes(startWith.options?.socket);
            return;
        } catch (err) {
            // this.emit('error', err);
        }

        for (const client of this.#clientByKey.values()) {
            if (client === startWith) continue;
            
            try {
                await this.#discoverNodes(client.options?.socket);
                return;
            } catch (err) {
                // this.emit('error', err);
            }
        }

        throw new Error('None of the cluster nodes is available');
    }

    async #discoverNodes(socketOptions?: RedisSocketOptions) {
        const client = RedisClient.create({
            socket: socketOptions
        });

        await client.connect();

        try {
            await this.#reset(await client.clusterNodes());
        } finally {
            await client.disconnect(); // TODO: catch error from disconnect?
        }
    }

    async #reset(masters: Array<RedisClusterMasterNode>): Promise<void> {
        // Override this.#slots and add not existing clients to this.#clientByKey
        const promises: Array<Promise<void>> = [],
            clientsInUse = new Set<string>();
        for (const master of masters) {
            const masterClient = this.#initiateClientForNode(master, false, clientsInUse, promises),
                replicasClients = this.#options.useReplicas ?
                    master.replicas.map(replica => this.#initiateClientForNode(replica, true, clientsInUse, promises)) :
                    [];

            for (const slot of master.slots) {
                for (let i = slot.from; i < slot.to; i++) {
                    this.#slots[i] = {
                        master: masterClient,
                        replicas: replicasClients,
                        iterator: undefined // will be initiated in use
                    };
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

    #initiateClientForNode(node: RedisClusterMasterNode | RedisClusterReplicaNode, readonly: boolean, clientsInUse: Set<string>, promises: Array<Promise<void>>): RedisClient {
        clientsInUse.add(node.url);

        let client = this.#clientByKey.get(node.url);
        if (!client) {
            client = RedisClient.create({
                socket: {
                    host: node.host,
                    port: node.port
                },
                readonly
            });
            promises.push(client.connect());
            this.#clientByKey.set(node.url, client);
        }

        return client;
    }

    #getSlotMaster(slot: number): RedisClient {
        return this.#slots[slot].master;
    }

    *#slotIterator(slotNumber: number): IterableIterator<RedisClient> {
        const slot = this.#slots[slotNumber];
        yield slot.master;

        for (const replica of slot.replicas) {
            yield replica;
        }
    }

    #getSlotClient(slotNumber: number): RedisClient {
        const slot = this.#slots[slotNumber];
        if (!slot.iterator) {
            slot.iterator = this.#slotIterator(slotNumber);
        }

        const {done, value} = slot.iterator.next();
        if (done) {
            slot.iterator = undefined;
            return this.#getSlotClient(slotNumber);
        }

        return value;
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

    getClient(firstKey?: string, isReadonly?: boolean): RedisClient {
        if (!firstKey) {
            return this.#getRandomClient();
        }

        const slot = calculateSlot(firstKey);
        if (!isReadonly || !this.#options.useReplicas) {
            return this.#getSlotMaster(slot);
        }

        return this.#getSlotClient(slot);
    }

    async disconnect(): Promise<void> {
        await Promise.all(
            [...this.#clientByKey.values()].map(client => client.disconnect())
        );

        this.#clientByKey.clear();
        this.#slots.splice(0);
    }
}
