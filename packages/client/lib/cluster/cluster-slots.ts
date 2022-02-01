import RedisClient, { InstantiableRedisClient, RedisClientType } from '../client';
import { RedisClusterMasterNode, RedisClusterReplicaNode } from '../commands/CLUSTER_NODES';
import { RedisClusterClientOptions, RedisClusterOptions } from '.';
import { RedisCommandArgument, RedisModules, RedisScripts } from '../commands';
import { RootNodesUnavailableError } from '../errors';

// We need to use 'require', because it's not possible with Typescript to import
// function that are exported as 'module.exports = function`, without esModuleInterop
// set to true.
const calculateSlot = require('cluster-key-slot');

export interface ClusterNode<M extends RedisModules, S extends RedisScripts> {
    id: string;
    client: RedisClientType<M, S>;
}

interface SlotNodes<M extends RedisModules, S extends RedisScripts> {
    master: ClusterNode<M, S>;
    replicas: Array<ClusterNode<M, S>>;
    clientIterator: IterableIterator<RedisClientType<M, S>> | undefined;
}

type OnError = (err: unknown) => void;

export default class RedisClusterSlots<M extends RedisModules, S extends RedisScripts> {
    readonly #options: RedisClusterOptions<M, S>;
    readonly #Client: InstantiableRedisClient<M, S>;
    readonly #onError: OnError;
    readonly #nodeByUrl = new Map<string, ClusterNode<M, S>>();
    readonly #slots: Array<SlotNodes<M, S>> = [];

    constructor(options: RedisClusterOptions<M, S>, onError: OnError) {
        this.#options = options;
        this.#Client = RedisClient.extend(options);
        this.#onError = onError;
    }

    async connect(): Promise<void> {
        for (const rootNode of this.#options.rootNodes) {
            if (await this.#discoverNodes(this.#clientOptionsDefaults(rootNode))) return;
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

    async rediscover(startWith: RedisClientType<M, S>): Promise<void> {
        if (!this.#runningRediscoverPromise) {
            this.#runningRediscoverPromise = this.#rediscover(startWith)
                .finally(() => this.#runningRediscoverPromise = undefined);
        }

        return this.#runningRediscoverPromise;
    }

    async #rediscover(startWith: RedisClientType<M, S>): Promise<void> {
        if (await this.#discoverNodes(startWith.options)) return;

        for (const { client } of this.#nodeByUrl.values()) {
            if (client === startWith) continue;

            if (await this.#discoverNodes(client.options)) return;
        }

        throw new Error('None of the cluster nodes is available');
    }

    async #reset(masters: Array<RedisClusterMasterNode>): Promise<void> {
        // Override this.#slots and add not existing clients to this.#nodeByUrl
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

        // Remove unused clients from this.#nodeByUrl using clientsInUse
        for (const [url, { client }] of this.#nodeByUrl.entries()) {
            if (clientsInUse.has(url)) continue;

            promises.push(client.disconnect());
            this.#nodeByUrl.delete(url);
        }

        await Promise.all(promises);
    }

    #clientOptionsDefaults(options?: RedisClusterClientOptions): RedisClusterClientOptions | undefined {
        if (!this.#options.defaults) return options;

        const merged = Object.assign({}, this.#options.defaults, options);

        if (options?.socket && this.#options.defaults.socket) {
            Object.assign({}, this.#options.defaults.socket, options.socket);
        }

        return merged;
    }

    #initiateClient(options?: RedisClusterClientOptions): RedisClientType<M, S> {
        return new this.#Client(this.#clientOptionsDefaults(options))
            .on('error', this.#onError);
    }

    #initiateClientForNode(nodeData: RedisClusterMasterNode | RedisClusterReplicaNode, readonly: boolean, clientsInUse: Set<string>, promises: Array<Promise<void>>): ClusterNode<M, S> {
        const url = `${nodeData.host}:${nodeData.port}`;
        clientsInUse.add(url);

        let node = this.#nodeByUrl.get(url);
        if (!node) {
            node = {
                id: nodeData.id,
                client: this.#initiateClient({
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

    getClient(firstKey?: RedisCommandArgument, isReadonly?: boolean): RedisClientType<M, S> {
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

    quit(): Promise<void> {
        return this.#destroy(client => client.quit());
    }

    disconnect(): Promise<void> {
        return this.#destroy(client => client.disconnect());
    }

    async #destroy(fn: (client: RedisClientType<M, S>) => Promise<unknown>): Promise<void> {
        const promises = [];
        for (const { client } of this.#nodeByUrl.values()) {
            promises.push(fn(client));
        }

        await Promise.all(promises);

        this.#nodeByUrl.clear();
        this.#slots.splice(0);
    }
}
