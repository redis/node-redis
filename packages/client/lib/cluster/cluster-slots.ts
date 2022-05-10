import RedisClient, { InstantiableRedisClient, RedisClientType } from '../client';
import { RedisClusterMasterNode, RedisClusterReplicaNode } from '../commands/CLUSTER_NODES';
import { RedisClusterClientOptions, RedisClusterOptions } from '.';
import { RedisCommandArgument, RedisFunctions, RedisModules, RedisScripts } from '../commands';
import { RootNodesUnavailableError } from '../errors';

// We need to use 'require', because it's not possible with Typescript to import
// function that are exported as 'module.exports = function`, without esModuleInterop
// set to true.
const calculateSlot = require('cluster-key-slot');

export interface ClusterNode<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> {
    id: string;
    client: RedisClientType<M, F, S>;
}

interface NodeAddress {
    host: string;
    port: number;
}

export type NodeAddressMap = {
    [address: string]: NodeAddress;
} | ((address: string) => NodeAddress | undefined);

interface SlotNodes<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> {
    master: ClusterNode<M, F, S>;
    replicas: Array<ClusterNode<M, F, S>>;
    clientIterator: IterableIterator<RedisClientType<M, F, S>> | undefined;
}

type OnError = (err: unknown) => void;

export default class RedisClusterSlots<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> {
    readonly #options: RedisClusterOptions<M, F, S>;
    readonly #Client: InstantiableRedisClient<M, F, S>;
    readonly #onError: OnError;
    readonly #nodeByAddress = new Map<string, ClusterNode<M, F, S>>();
    readonly #slots: Array<SlotNodes<M, F, S>> = [];

    constructor(options: RedisClusterOptions<M, F, S>, onError: OnError) {
        this.#options = options;
        this.#Client = RedisClient.extend(options);
        this.#onError = onError;
    }

    async connect(): Promise<void> {
        for (const rootNode of this.#options.rootNodes) {
            if (await this.#discoverNodes(rootNode)) return;
        }

        throw new RootNodesUnavailableError();
    }

    async #discoverNodes(clientOptions?: RedisClusterClientOptions): Promise<boolean> {
        const client = this.#initiateClient(clientOptions);

        await client.connect();

        try {
            await this.#reset(await client.clusterNodes());
            return true;
        } catch (err) {
            this.#onError(err);
            return false;
        } finally {
            if (client.isOpen) {
                await client.disconnect();
            }
        }
    }

    #runningRediscoverPromise?: Promise<void>;

    async rediscover(startWith: RedisClientType<M, F, S>): Promise<void> {
        if (!this.#runningRediscoverPromise) {
            this.#runningRediscoverPromise = this.#rediscover(startWith)
                .finally(() => this.#runningRediscoverPromise = undefined);
        }

        return this.#runningRediscoverPromise;
    }

    async #rediscover(startWith: RedisClientType<M, F, S>): Promise<void> {
        if (await this.#discoverNodes(startWith.options)) return;

        for (const { client } of this.#nodeByAddress.values()) {
            if (client === startWith) continue;

            if (await this.#discoverNodes(client.options)) return;
        }

        throw new Error('None of the cluster nodes is available');
    }

    async #reset(masters: Array<RedisClusterMasterNode>): Promise<void> {
        // Override this.#slots and add not existing clients to this.#nodeByAddress
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
                for (let i = from; i <= to; i++) {
                    this.#slots[i] = slot;
                }
            }
        }

        // Remove unused clients from this.#nodeByAddress using clientsInUse
        for (const [address, { client }] of this.#nodeByAddress.entries()) {
            if (clientsInUse.has(address)) continue;

            promises.push(client.disconnect());
            this.#nodeByAddress.delete(address);
        }

        await Promise.all(promises);
    }

    #clientOptionsDefaults(options?: RedisClusterClientOptions): RedisClusterClientOptions | undefined {
        if (!this.#options.defaults) return options;

        return {
            ...this.#options.defaults,
            ...options,
            socket: this.#options.defaults.socket && options?.socket ? {
                ...this.#options.defaults.socket,
                ...options.socket
            } : this.#options.defaults.socket ?? options?.socket
        };
    }

    #initiateClient(options?: RedisClusterClientOptions): RedisClientType<M, F, S> {
        return new this.#Client(this.#clientOptionsDefaults(options))
            .on('error', this.#onError);
    }

    #getNodeAddress(address: string): NodeAddress | undefined {
        switch (typeof this.#options.nodeAddressMap) {
            case 'object':
                return this.#options.nodeAddressMap[address];

            case 'function':
                return this.#options.nodeAddressMap(address);
        }
    }

    #initiateClientForNode(
        nodeData: RedisClusterMasterNode | RedisClusterReplicaNode,
        readonly: boolean,
        clientsInUse: Set<string>,
        promises: Array<Promise<void>>
    ): ClusterNode<M, F, S> {
        const address = `${nodeData.host}:${nodeData.port}`;
        clientsInUse.add(address);

        let node = this.#nodeByAddress.get(address);
        if (!node) {
            node = {
                id: nodeData.id,
                client: this.#initiateClient({
                    socket: this.#getNodeAddress(address) ?? {
                        host: nodeData.host,
                        port: nodeData.port
                    },
                    readonly
                })
            };
            promises.push(node.client.connect());
            this.#nodeByAddress.set(address, node);
        }

        return node;
    }

    getSlotMaster(slot: number): ClusterNode<M, F, S> {
        return this.#slots[slot].master;
    }

    *#slotClientIterator(slotNumber: number): IterableIterator<RedisClientType<M, F, S>> {
        const slot = this.#slots[slotNumber];
        yield slot.master.client;

        for (const replica of slot.replicas) {
            yield replica.client;
        }
    }

    #getSlotClient(slotNumber: number): RedisClientType<M, F, S> {
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

    #randomClientIterator?: IterableIterator<ClusterNode<M, F, S>>;

    #getRandomClient(): RedisClientType<M, F, S> {
        if (!this.#nodeByAddress.size) {
            throw new Error('Cluster is not connected');
        }

        if (!this.#randomClientIterator) {
            this.#randomClientIterator = this.#nodeByAddress.values();
        }

        const {done, value} = this.#randomClientIterator.next();
        if (done) {
            this.#randomClientIterator = undefined;
            return this.#getRandomClient();
        }

        return value.client;
    }

    getClient(firstKey?: RedisCommandArgument, isReadonly?: boolean): RedisClientType<M, F, S> {
        if (!firstKey) {
            return this.#getRandomClient();
        }

        const slot = calculateSlot(firstKey);
        if (!isReadonly || !this.#options.useReplicas) {
            return this.getSlotMaster(slot).client;
        }

        return this.#getSlotClient(slot);
    }

    getMasters(): Array<ClusterNode<M, F, S>> {
        const masters = [];
        for (const node of this.#nodeByAddress.values()) {
            if (node.client.options?.readonly) continue;

            masters.push(node);
        }

        return masters;
    }

    getNodeByAddress(address: string): ClusterNode<M, F, S> | undefined {
        const mappedAddress = this.#getNodeAddress(address);
        return this.#nodeByAddress.get(
            mappedAddress ? `${mappedAddress.host}:${mappedAddress.port}` : address
        );
    }

    quit(): Promise<void> {
        return this.#destroy(client => client.quit());
    }

    disconnect(): Promise<void> {
        return this.#destroy(client => client.disconnect());
    }

    async #destroy(fn: (client: RedisClientType<M, F, S>) => Promise<unknown>): Promise<void> {
        const promises = [];
        for (const { client } of this.#nodeByAddress.values()) {
            promises.push(fn(client));
        }

        await Promise.all(promises);

        this.#nodeByAddress.clear();
        this.#slots.splice(0);
    }
}
