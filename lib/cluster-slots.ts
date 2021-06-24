import calculateSlot from 'cluster-key-slot';
import RedisClient, { RedisClientType } from './client';
import { RedisSocketOptions } from './socket';
import { RedisClusterMasterNode, RedisClusterReplicaNode } from './commands/CLUSTER_NODES';
import { RedisClusterOptions } from './cluster';
import { RedisModules } from './commands';
import { RedisLuaScripts } from './lua-script';

interface SlotClients<M extends RedisModules, S extends RedisLuaScripts> {
    master: RedisClientType<M, S>;
    replicas: Array<RedisClientType<M, S>>;
    iterator: IterableIterator<RedisClientType<M, S>> | undefined;
}

export default class RedisClusterSlots<M extends RedisModules, S extends RedisLuaScripts> {
    readonly #options: RedisClusterOptions;
    readonly #clientByKey = new Map<string, RedisClientType<M, S>>();
    readonly #slots: Array<SlotClients<M, S>> = [];

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

    async discover(startWith: RedisClientType<M, S>): Promise<void> {
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
            const slot = {
                master: this.#initiateClientForNode(master, false, clientsInUse, promises),
                replicas: this.#options.useReplicas ?
                    master.replicas.map(replica => this.#initiateClientForNode(replica, true, clientsInUse, promises)) :
                    [],
                iterator: undefined // will be initiated in use
            };

            for (const { from, to } of master.slots) {
                for (let i = from; i < to; i++) {
                    this.#slots[i] = slot;
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

    #initiateClientForNode(node: RedisClusterMasterNode | RedisClusterReplicaNode, readonly: boolean, clientsInUse: Set<string>, promises: Array<Promise<void>>): RedisClientType<M, S> {
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

    #getSlotMaster(slot: number): RedisClientType<M, S> {
        return this.#slots[slot].master;
    }

    *#slotIterator(slotNumber: number): IterableIterator<RedisClientType<M, S>> {
        const slot = this.#slots[slotNumber];
        yield slot.master;

        for (const replica of slot.replicas) {
            yield replica;
        }
    }

    #getSlotClient(slotNumber: number): RedisClientType<M, S> {
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

    #randomClientIterator?: IterableIterator<RedisClientType<M, S>>;

    #getRandomClient(): RedisClientType<M, S> {
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

    getClient(firstKey?: string, isReadonly?: boolean): RedisClientType<M, S> {
        if (!firstKey) {
            return this.#getRandomClient();
        }

        const slot = calculateSlot(firstKey);
        if (!isReadonly || !this.#options.useReplicas) {
            return this.#getSlotMaster(slot);
        }

        return this.#getSlotClient(slot);
    }

    getMasters(): Array<RedisClientType<M, S>> {
        const masters = [];

        for (const client of this.#clientByKey.values()) {
            if (client.options?.readonly) continue;

            masters.push(client);
        }

        return masters;
    }

    async disconnect(): Promise<void> {
        await Promise.all(
            [...this.#clientByKey.values()].map(client => client.disconnect())
        );

        this.#clientByKey.clear();
        this.#slots.splice(0);
    }
}
