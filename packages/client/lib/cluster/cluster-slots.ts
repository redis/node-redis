import { RedisClusterClientOptions, RedisClusterOptions } from '.';
import { RootNodesUnavailableError } from '../errors';
import RedisClient, { RedisClientOptions, RedisClientType } from '../client';
import { types } from 'util';
import { EventEmitter } from 'stream';
import { ChannelListeners, PubSubType, PubSubTypeListeners } from '../client/pub-sub';
import { RedisArgument, RedisFunctions, RedisModules, RedisScripts, RespVersions } from '../RESP/types';

// TODO: ?!
// We need to use 'require', because it's not possible with Typescript to import
// function that are exported as 'module.exports = function`, without esModuleInterop
// set to true.
const calculateSlot = require('cluster-key-slot');

interface NodeAddress {
  host: string;
  port: number;
}

export type NodeAddressMap = {
  [address: string]: NodeAddress;
} | ((address: string) => NodeAddress | undefined);

type ValueOrPromise<T> = T | Promise<T>;

type ClientOrPromise<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions = 2
> = ValueOrPromise<RedisClientType<M, F, S, RESP>>;

export interface Node<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> {
  address: string;
  client?: ClientOrPromise<M, F, S, RESP>;
}

export interface ShardNode<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> extends Node<M, F, S, RESP> {
  id: string;
  host: string;
  port: number;
  readonly: boolean;
}

export interface MasterNode<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> extends ShardNode<M, F, S, RESP> {
  pubSubClient?: ClientOrPromise<M, F, S, RESP>;
}

export interface Shard<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> {
  master: MasterNode<M, F, S, RESP>;
  replicas?: Array<ShardNode<M, F, S, RESP>>;
  nodesIterator?: IterableIterator<ShardNode<M, F, S, RESP>>;
}

type ShardWithReplicas<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> = Shard<M, F, S, RESP> & Required<Pick<Shard<M, F, S, RESP>, 'replicas'>>;

export type PubSubNode<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> = Required<Node<M, F, S, RESP>>;

type PubSubToResubscribe = Record<
  PubSubType.CHANNELS | PubSubType.PATTERNS,
  PubSubTypeListeners
>;

export type OnShardedChannelMovedError = (
  err: unknown,
  channel: string,
  listeners?: ChannelListeners
) => void;

export default class RedisClusterSlots<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> {
  private static _SLOTS = 16384;

  private readonly _options: RedisClusterOptions<M, F, S, RESP>;
  private readonly _clientFactory: ReturnType<typeof RedisClient.factory<M, F, S, RESP>>;
  private readonly _emit: EventEmitter['emit'];
  slots = new Array<Shard<M, F, S, RESP>>(RedisClusterSlots._SLOTS);
  shards = new Array<Shard<M, F, S,RESP>>();
  masters = new Array<ShardNode<M, F, S, RESP>>();
  replicas = new Array<ShardNode<M, F, S, RESP>>();
  readonly nodeByAddress = new Map<string, MasterNode<M, F, S, RESP> | ShardNode<M, F, S, RESP>>();
  pubSubNode?: PubSubNode<M, F, S, RESP>;

  private _isOpen = false;

  get isOpen() {
    return this._isOpen;
  }

  constructor(
    options: RedisClusterOptions<M, F, S, RESP>,
    emit: EventEmitter['emit']
  ) {
    this._options = options;
    this._clientFactory = RedisClient.factory(options);
    this._emit = emit;
  }

  async connect() {
    if (this._isOpen) {
      throw new Error('Cluster already open');
    }

    this._isOpen = true;
    try {
      await this._discoverWithRootNodes();
    } catch (err) {
      this._isOpen = false;
      throw err;
    }
  }

  private async _discoverWithRootNodes() {
    let start = Math.floor(Math.random() * this._options.rootNodes.length);
    for (let i = start; i < this._options.rootNodes.length; i++) {
      if (await this._discover(this._options.rootNodes[i])) return;
    }

    for (let i = 0; i < start; i++) {
      if (await this._discover(this._options.rootNodes[i])) return;
    }

    throw new RootNodesUnavailableError();
  }

  private _resetSlots() {
    this.slots = new Array(RedisClusterSlots._SLOTS);
    this.shards = [];
    this.masters = [];
    this.replicas = [];
    this._randomNodeIterator = undefined;
  }

  private async _discover(rootNode: RedisClusterClientOptions) {
    this._resetSlots();
    const addressesInUse = new Set<string>();

    try {
      const shards = await this._getShards(rootNode),
        promises: Array<Promise<unknown>> = [],
        eagerConnect = this._options.minimizeConnections !== true;

      for (const { from, to, master, replicas } of shards) {
        const shard: Shard<M, F, S, RESP> = {
          master: this._initiateSlotNode(master, false, eagerConnect, addressesInUse, promises)
        };

        if (this._options.useReplicas) {
          shard.replicas = replicas.map(replica =>
            this._initiateSlotNode(replica, true, eagerConnect, addressesInUse, promises)
          );
        }

        this.shards.push(shard);

        for (let i = from; i <= to; i++) {
          this.slots[i] = shard;
        }
      }

      if (this.pubSubNode && !addressesInUse.has(this.pubSubNode.address)) {
        if (types.isPromise(this.pubSubNode.client)) {
          promises.push(
            this.pubSubNode.client.then(client => client.disconnect())
          );
          this.pubSubNode = undefined;
        } else {
          promises.push(this.pubSubNode.client.disconnect());

          const channelsListeners = this.pubSubNode.client.getPubSubListeners(PubSubType.CHANNELS),
            patternsListeners = this.pubSubNode.client.getPubSubListeners(PubSubType.PATTERNS);

          if (channelsListeners.size || patternsListeners.size) {
            promises.push(
              this._initiatePubSubClient({
                [PubSubType.CHANNELS]: channelsListeners,
                [PubSubType.PATTERNS]: patternsListeners
              })
            );
          }
        }
      }

      for (const [address, node] of this.nodeByAddress.entries()) {
        if (addressesInUse.has(address)) continue;

        if (node.client) {
          promises.push(
            this._execOnNodeClient(node.client, client => client.disconnect())
          );
        }

        const { pubSubClient } = node as MasterNode<M, F, S, RESP>;
        if (pubSubClient) {
          promises.push(
            this._execOnNodeClient(pubSubClient, client => client.disconnect())
          );
        }

        this.nodeByAddress.delete(address);
      }

      await Promise.all(promises);

      return true;
    } catch (err) {
      this._emit('error', err);
      return false;
    }
  }

  private async _getShards(rootNode: RedisClusterClientOptions) {
    const options = this._clientOptionsDefaults(rootNode)!;
    options.socket ??= {};
    options.socket.reconnectStrategy = false;
    options.RESP = this._options.RESP;

    const client = RedisClient.factory(this._options)(options);

    client.on('error', err => this._emit('error', err));

    await client.connect();

    try {
      // switch to `CLUSTER SHARDS` when Redis 7.0 will be the minimum supported version
      return await client.clusterSlots();
    } finally {
      client.destroy();
    }
  }

  private _getNodeAddress(address: string): NodeAddress | undefined {
    switch (typeof this._options.nodeAddressMap) {
      case 'object':
        return this._options.nodeAddressMap[address];

      case 'function':
        return this._options.nodeAddressMap(address);
    }
  }

  private _clientOptionsDefaults(options?: RedisClientOptions): RedisClientOptions | undefined {
    if (!this._options.defaults) return options;

    let socket;
    if (this._options.defaults.socket) {
      socket = options?.socket ? {
        ...this._options.defaults.socket,
        ...options.socket
      } : this._options.defaults.socket;
    } else {
      socket = options?.socket;
    }

    return {
      ...this._options.defaults,
      ...options,
      socket
    };
  }

  private _initiateSlotNode(
    shard: NodeAddress & { id: string; },
    readonly: boolean,
    eagerConnent: boolean,
    addressesInUse: Set<string>,
    promises: Array<Promise<unknown>>
  ) {
    const address = `${shard.host}:${shard.port}`;
    addressesInUse.add(address);

    let node = this.nodeByAddress.get(address);
    if (!node) {
      node = {
        ...shard,
        address,
        readonly,
        client: undefined
      };

      if (eagerConnent) {
        promises.push(this._createNodeClient(node));
      }

      this.nodeByAddress.set(address, node);
    }

    (readonly ? this.replicas : this.masters).push(node);

    return node;
  }

  private async _createClient(
    node: ShardNode<M, F, S, RESP>,
    readonly = node.readonly
  ) {
    const client = this._clientFactory(
      this._clientOptionsDefaults({
        socket: this._getNodeAddress(node.address) ?? {
          host: node.host,
          port: node.port
        },
        readonly,
        RESP: this._options.RESP
      })
    );
    client.on('error', err => this._emit('error', err));

    await client.connect();

    return client;
  }

  private _createNodeClient(node: ShardNode<M, F, S, RESP>) {
    const promise = this._createClient(node)
      .then(client => {
        node.client = client;
        return client;
      })
      .catch(err => {
        node.client = undefined;
        throw err;
      });
    node.client = promise;
    return promise;
  }

  nodeClient(node: ShardNode<M, F, S, RESP>) {
    return node.client ?? this._createNodeClient(node);
  }

  #runningRediscoverPromise?: Promise<void>;

  async rediscover(startWith: RedisClientType<M, F, S, RESP>): Promise<void> {
    this.#runningRediscoverPromise ??= this._rediscover(startWith)
      .finally(() => this.#runningRediscoverPromise = undefined);
    return this.#runningRediscoverPromise;
  }

  private async _rediscover(startWith: RedisClientType<M, F, S, RESP>): Promise<void> {
    if (await this._discover(startWith.options!)) return;

    return this._discoverWithRootNodes();
  }

  /**
   * @deprecated Use `close` instead.
   */
  quit(): Promise<void> {
    return this._destroy(client => client.quit());
  }

  /**
   * @deprecated Use `destroy` instead.
   */
  disconnect(): Promise<void> {
    return this._destroy(client => client.disconnect());
  }

  close() {
    return this._destroy(client => client.close());
  }

  destroy() {
    this._isOpen = false;

    for (const client of this._clients()) {
      this._execOnNodeClient(client, client => client.destroy());
    }

    if (this.pubSubNode) {
      this._execOnNodeClient(this.pubSubNode.client, client => client.destroy());
      this.pubSubNode = undefined;
    }

    this._resetSlots();
    this.nodeByAddress.clear();
  }

  private *_clients() {
    for (const { master, replicas } of this.shards) {
      if (master.client) {
        yield master.client;
      }

      if (master.pubSubClient) {
        yield master.pubSubClient;
      }

      if (replicas) {
        for (const { client } of replicas) {
          if (client) {
            yield client;
          }
        }
      }
    }
  }

  private async _destroy(fn: (client: RedisClientType<M, F, S, RESP>) => Promise<unknown>): Promise<void> {
    this._isOpen = false;

    const promises = [];
    for (const client of this._clients()) {
      promises.push(this._execOnNodeClient(client, fn));
    }

    if (this.pubSubNode) {
      promises.push(this._execOnNodeClient(this.pubSubNode.client, fn));
      this.pubSubNode = undefined;
    }

    this._resetSlots();
    this.nodeByAddress.clear();

    await Promise.allSettled(promises);
  }

  private _execOnNodeClient<T>(
    client: ClientOrPromise<M, F, S, RESP>,
    fn: (client: RedisClientType<M, F, S, RESP>) => T
  ): T | Promise<T> {
    return types.isPromise(client) ?
      client.then(fn) :
      fn(client);
  }

  getClient(
    firstKey: RedisArgument | undefined,
    isReadonly: boolean | undefined
  ): ClientOrPromise<M, F, S, RESP> {
    if (!firstKey) {
      return this.nodeClient(this.getRandomNode());
    }

    const slotNumber = calculateSlot(firstKey);
    if (!isReadonly) {
      return this.nodeClient(this.slots[slotNumber].master);
    }

    return this.nodeClient(this.getSlotRandomNode(slotNumber));
  }

  private *_iterateAllNodes() {
    let i = Math.floor(Math.random() * (this.masters.length + this.replicas.length));
    if (i < this.masters.length) {
      do {
        yield this.masters[i];
      } while (++i < this.masters.length);

      for (const replica of this.replicas) {
        yield replica;
      }
    } else {
      i -= this.masters.length;
      do {
        yield this.replicas[i];
      } while (++i < this.replicas.length);
    }

    while (true) {
      for (const master of this.masters) {
        yield master;
      }

      for (const replica of this.replicas) {
        yield replica;
      }
    }
  }

  _randomNodeIterator?: IterableIterator<ShardNode<M, F, S, RESP>>;

  getRandomNode() {
    this._randomNodeIterator ??= this._iterateAllNodes();
    return this._randomNodeIterator.next().value as ShardNode<M, F, S, RESP>;
  }

  private *_slotNodesIterator(slot: ShardWithReplicas<M, F, S, RESP>) {
    let i = Math.floor(Math.random() * (1 + slot.replicas.length));
    if (i < slot.replicas.length) {
      do {
        yield slot.replicas[i];
      } while (++i < slot.replicas.length);
    }

    while (true) {
      yield slot.master;

      for (const replica of slot.replicas) {
        yield replica;
      }
    }
  }

  getSlotRandomNode(slotNumber: number) {
    const slot = this.slots[slotNumber];
    if (!slot.replicas?.length) {
      return slot.master;
    }

    slot.nodesIterator ??= this._slotNodesIterator(slot as ShardWithReplicas<M, F, S, RESP>);
    return slot.nodesIterator.next().value as ShardNode<M, F, S, RESP>;
  }

  getMasterByAddress(address: string) {
    const master = this.nodeByAddress.get(address);
    if (!master) return;

    return this.nodeClient(master);
  }

  getPubSubClient() {
    return this.pubSubNode ?
      this.pubSubNode.client :
      this._initiatePubSubClient();
  }

  private async _initiatePubSubClient(toResubscribe?: PubSubToResubscribe) {
    const index = Math.floor(Math.random() * (this.masters.length + this.replicas.length)),
      node = index < this.masters.length ?
        this.masters[index] :
        this.replicas[index - this.masters.length];

    this.pubSubNode = {
      address: node.address,
      client: this._createClient(node, true)
        .then(async client => {
          if (toResubscribe) {
            await Promise.all([
              client.extendPubSubListeners(PubSubType.CHANNELS, toResubscribe[PubSubType.CHANNELS]),
              client.extendPubSubListeners(PubSubType.PATTERNS, toResubscribe[PubSubType.PATTERNS])
            ]);
          }

          this.pubSubNode!.client = client;
          return client;
        })
        .catch(err => {
          this.pubSubNode = undefined;
          throw err;
        })
    };

    return this.pubSubNode.client as Promise<RedisClientType<M, F, S, RESP>>;
  }

  async executeUnsubscribeCommand(
    unsubscribe: (client: RedisClientType<M, F, S, RESP>) => Promise<void>
  ): Promise<void> {
    const client = await this.getPubSubClient();
    await unsubscribe(client);

    if (!client.isPubSubActive) {
      client.destroy();
      this.pubSubNode = undefined;
    }
  }

  getShardedPubSubClient(channel: string) {
    const { master } = this.slots[calculateSlot(channel)];
    return master.pubSubClient ?? this.#initiateShardedPubSubClient(master);
  }

  #initiateShardedPubSubClient(master: MasterNode<M, F, S, RESP>) {
    const promise = this._createClient(master, true)
      .then(client => {
        client.on('server-sunsubscribe', async (channel, listeners) => {
          try {
            await this.rediscover(client);
            const redirectTo = await this.getShardedPubSubClient(channel);
            redirectTo.extendPubSubChannelListeners(
              PubSubType.SHARDED,
              channel,
              listeners
            );
          } catch (err) {
            this._emit('sharded-shannel-moved-error', err, channel, listeners);
          }
        });

        master.pubSubClient = client;
        return client;
      })
      .catch(err => {
        master.pubSubClient = undefined;
        throw err;
      });

    master.pubSubClient = promise;

    return promise;
  }

  async executeShardedUnsubscribeCommand(
    channel: string,
    unsubscribe: (client: RedisClientType<M, F, S, RESP>) => Promise<void>
  ): Promise<void> {
    const { master } = this.slots[calculateSlot(channel)];
    if (!master.pubSubClient) return Promise.resolve();

    const client = await master.pubSubClient;
    await unsubscribe(client);

    if (!client.isPubSubActive) {
      await client.disconnect();
      master.pubSubClient = undefined;
    }
  }
}
