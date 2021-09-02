import calculateSlot from 'cluster-key-slot';
import RedisClient, { RedisClientType } from './client';
import { RedisSocketOptions } from './socket';
import { RedisClusterMasterNode, RedisClusterReplicaNode } from './commands/CLUSTER_NODES';
import { RedisClusterOptions } from './cluster';
import { RedisModules } from './commands';
import { RedisLuaScripts } from './lua-script';

export interface ClusterNode<M extends RedisModules, S extends RedisLuaScripts> {
    id: string;
    client: RedisClientType<M, S>;
}

interface SlotNodes<M extends RedisModules, S extends RedisLuaScripts> {
    master: ClusterNode<M, S>;
    replicas: Array<ClusterNode<M, S>>;
    clientIterator: IterableIterator<RedisClientType<M, S>> | undefined;
}

export default class RedisClusterSlots<M extends RedisModules, S extends RedisLuaScripts> {
    readonly #options: RedisClusterOptions;
    readonly #nodeByUrl = new Map<string, ClusterNode<M, S>>();
    readonly #slots: Array<SlotNodes<M, S>> = [];

    constructor(options: RedisClusterOptions) {
        this.#options = options;
    }

    async connect(): Promise<void> {
        for (const rootNode of this.#options.rootNodes) {
            try {
                await this.#discoverNodes(rootNode);
                return;
            } catch (err) {
                console.error(err);
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
            console.error(err);
            // this.emit('error', err);
        }

        for (const { client } of this.#nodeByUrl.values()) {
            if (client === startWith) continue;
            
            try {
                await this.#discoverNodes(client.options?.socket);
                return;
            } catch (err) {
                console.error(err);
                // this.emit('error', err);
            }
        }

        throw new Error('None of the cluster nodes is available');
    }

    async #discoverNodes(socketOptions?: RedisSocketOptions): Promise<void> {
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
                    clientIterator: undefined // will be initiated in use
            };

            for (const { from, to } of master.slots) {
                for (let i = from; i < to; i++) {
                    this.#slots[i] = slot;
                }
            }
        }

        // Remove unused clients from this.#clientBykey using clientsInUse
        for (const [url, { client }] of this.#nodeByUrl.entries()) {
            if (clientsInUse.has(url)) continue;

            // TODO: ignore error from `.disconnect`?
            promises.push(client.disconnect());
            this.#nodeByUrl.delete(url);
        }

        await Promise.all(promises);
    }

    #initiateClientForNode(nodeData: RedisClusterMasterNode | RedisClusterReplicaNode, readonly: boolean, clientsInUse: Set<string>, promises: Array<Promise<void>>): ClusterNode<M, S> {
        const url = `${nodeData.host}:${nodeData.port}`;
        clientsInUse.add(url);

        let node = this.#nodeByUrl.get(url);
        if (!node) {
            node = {
                id: nodeData.id,
                client: RedisClient.create({
                    socket: {
                        host: nodeData.host,
                        port: nodeData.port
                    },
                    readonly
                })
            };
            promises.push(node.client.connect());
            this.#nodeByUrl.set(url, node);
        }

        return node;
    }

    getSlotMaster(slot: number): ClusterNode<M, S> {
        return this.#slots[slot].master;
    }

    *#slotClientIterator(slotNumber: number): IterableIterator<RedisClientType<M, S>> {
        const slot = this.#slots[slotNumber];
        yield slot.master.client;

        for (const replica of slot.replicas) {
            yield replica.client;
        }
    }

    #getSlotClient(slotNumber: number): RedisClientType<M, S> {
        const slot = this.#slots[slotNumber];
        if (!slot.clientIterator) {
            slot.clientIterator = this.#slotClientIterator(slotNumber);
        }

        const {done, value} = slot.clientIterator.next();
        if (done) {
            slot.clientIterator = undefined;
            return this.#getSlotClient(slotNumber);
        }

        return value;
    }

    #randomClientIterator?: IterableIterator<ClusterNode<M, S>>;

    #getRandomClient(): RedisClientType<M, S> {
        if (!this.#nodeByUrl.size) {
            throw new Error('Cluster is not connected');
        }

        if (!this.#randomClientIterator) {
            this.#randomClientIterator = this.#nodeByUrl.values();
        }

        const {done, value} = this.#randomClientIterator.next();
        if (done) {
            this.#randomClientIterator = undefined;
            return this.#getRandomClient();
        }

        return value.client;
    }

    getClient(firstKey?: string, isReadonly?: boolean): RedisClientType<M, S> {
        if (!firstKey) {
            return this.#getRandomClient();
        }

        const slot = calculateSlot(firstKey);
        if (!isReadonly || !this.#options.useReplicas) {
            return this.getSlotMaster(slot).client;
        }

        return this.#getSlotClient(slot);
    }

    getMasters(): Array<ClusterNode<M, S>> {
        const masters = [];

        for (const node of this.#nodeByUrl.values()) {
            if (node.client.options?.readonly) continue;

            masters.push(node);
        }

        return masters;
    }

    getNodeByUrl(url: string): ClusterNode<M, S> | undefined {
        return this.#nodeByUrl.get(url);
    }

    async disconnect(): Promise<void> {
        await Promise.all(
            [...this.#nodeByUrl.values()].map(({ client }) => client.disconnect())
        );

        this.#nodeByUrl.clear();
        this.#slots.splice(0);
    }
}
