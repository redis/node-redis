import { RedisClusterClientOptions, RedisClusterOptions } from '.';
import { RootNodesUnavailableError } from '../errors';
import RedisClient, { RedisClientOptions, RedisClientType } from '../client';
import { types } from 'node:util';
import { EventEmitter } from 'node:stream';
import { ChannelListeners, PubSubType, PubSubTypeListeners } from '../client/pub-sub';
import { RedisArgument, RedisFunctions, RedisModules, RedisScripts, RespVersions, TypeMapping } from '../RESP/types';

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

export interface Node<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> {
  address: string;
  client?: RedisClientType<M, F, S, RESP, TYPE_MAPPING>;
  connectPromise?: Promise<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>;
}

export interface ShardNode<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends Node<M, F, S, RESP, TYPE_MAPPING>, NodeAddress {
  id: string;
  readonly: boolean;
}

export interface MasterNode<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends ShardNode<M, F, S, RESP, TYPE_MAPPING> {
  pubSub?: {
    connectPromise?: Promise<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>;
    client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>;
  };
}

export interface Shard<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> {
  master: MasterNode<M, F, S, RESP, TYPE_MAPPING>;
  replicas?: Array<ShardNode<M, F, S, RESP, TYPE_MAPPING>>;
  nodesIterator?: IterableIterator<ShardNode<M, F, S, RESP, TYPE_MAPPING>>;
}

type ShardWithReplicas<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = Shard<M, F, S, RESP, TYPE_MAPPING> & Required<Pick<Shard<M, F, S, RESP, TYPE_MAPPING>, 'replicas'>>;

type PubSubNode<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = (
  Exclude<Node<M, F, S, RESP, TYPE_MAPPING>, 'client'> &
  Required<Pick<Node<M, F, S, RESP, TYPE_MAPPING>, 'client'>>
);

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
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> {
  private static _SLOTS = 16384;

  private readonly _options: RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING>;
  private readonly _clientFactory: ReturnType<typeof RedisClient.factory<M, F, S, RESP>>;
  private readonly _emit: EventEmitter['emit'];
  slots = new Array<Shard<M, F, S, RESP, TYPE_MAPPING>>(RedisClusterSlots._SLOTS);
  masters = new Array<MasterNode<M, F, S, RESP, TYPE_MAPPING>>();
  replicas = new Array<ShardNode<M, F, S, RESP, TYPE_MAPPING>>();
  readonly nodeByAddress = new Map<string, MasterNode<M, F, S, RESP, TYPE_MAPPING> | ShardNode<M, F, S, RESP, TYPE_MAPPING>>();
  pubSubNode?: PubSubNode<M, F, S, RESP, TYPE_MAPPING>;

  private _isOpen = false;

  get isOpen() {
    return this._isOpen;
  }

  constructor(
    options: RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING>,
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
      if (!this._isOpen) throw new Error('Cluster closed');
      if (await this._discover(this._options.rootNodes[i])) return;
    }

    for (let i = 0; i < start; i++) {
      if (!this._isOpen) throw new Error('Cluster closed');
      if (await this._discover(this._options.rootNodes[i])) return;
    }

    throw new RootNodesUnavailableError();
  }

  private _resetSlots() {
    this.slots = new Array(RedisClusterSlots._SLOTS);
    this.masters = [];
    this.replicas = [];
    this._randomNodeIterator = undefined;
  }

  private async _discover(rootNode: RedisClusterClientOptions) {
    this._resetSlots();
    try {
      const addressesInUse = new Set<string>(),
        promises: Array<Promise<unknown>> = [],
        eagerConnect = this._options.minimizeConnections !== true;

      for (const { from, to, master, replicas } of await this._getShards(rootNode)) {
        const shard: Shard<M, F, S, RESP, TYPE_MAPPING> = {
          master: this._initiateSlotNode(master, false, eagerConnect, addressesInUse, promises)
        };

        if (this._options.useReplicas) {
          shard.replicas = replicas.map(replica =>
            this._initiateSlotNode(replica, true, eagerConnect, addressesInUse, promises)
          );
        }

        for (let i = from; i <= to; i++) {
          this.slots[i] = shard;
        }
      }

      if (this.pubSubNode && !addressesInUse.has(this.pubSubNode.address)) {
        const channelsListeners = this.pubSubNode.client.getPubSubListeners(PubSubType.CHANNELS),
          patternsListeners = this.pubSubNode.client.getPubSubListeners(PubSubType.PATTERNS);

        this.pubSubNode.client.destroy();

        if (channelsListeners.size || patternsListeners.size) {
          promises.push(
            this._initiatePubSubClient({
              [PubSubType.CHANNELS]: channelsListeners,
              [PubSubType.PATTERNS]: patternsListeners
            })
          );
        }
      }

      for (const [address, node] of this.nodeByAddress.entries()) {
        if (addressesInUse.has(address)) continue;

        if (node.client) {
          node.client.destroy();
        }

        const { pubSub } = node as MasterNode<M, F, S, RESP, TYPE_MAPPING>;
        if (pubSub) {
          pubSub.client.destroy();
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
    options.commandOptions = undefined;

    // TODO: find a way to avoid type casting
    const client = await this._clientFactory(options as RedisClientOptions<M, F, S, RESP, {}>)
      .on('error', err => this._emit('error', err))
      .connect();

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

  private _clientOptionsDefaults(options?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>) {
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

    let node = this.nodeByAddress.get(address);
    if (!node) {
      node = {
        ...shard,
        address,
        readonly,
        client: undefined,
        connectPromise: undefined
      };

      if (eagerConnent) {
        promises.push(this._createNodeClient(node));
      }

      this.nodeByAddress.set(address, node);
    }

    if (!addressesInUse.has(address)) {
      addressesInUse.add(address);
      (readonly ? this.replicas : this.masters).push(node);
    }

    return node;
  }

  private _createClient(node: ShardNode<M, F, S, RESP, TYPE_MAPPING>, readonly = node.readonly) {
    return this._clientFactory(
      this._clientOptionsDefaults({
        socket: this._getNodeAddress(node.address) ?? {
          host: node.host,
          port: node.port
        },
        readonly,
        RESP: this._options.RESP
      })
    ).on('error', err => console.error(err));
  }

  private _createNodeClient(node: ShardNode<M, F, S, RESP, TYPE_MAPPING>, readonly?: boolean) {
    const client = node.client = this._createClient(node, readonly);
    return node.connectPromise = client.connect()
      .finally(() => node.connectPromise = undefined);
  }

  nodeClient(node: ShardNode<M, F, S, RESP, TYPE_MAPPING>) {
    return (
      node.connectPromise ?? // if the node is connecting
      node.client ?? // if the node is connected
      this._createNodeClient(node) // if the not is disconnected
    );
  }

  private _runningRediscoverPromise?: Promise<void>;

  async rediscover(startWith: RedisClientType<M, F, S, RESP>): Promise<void> {
    this._runningRediscoverPromise ??= this._rediscover(startWith)
      .finally(() => this._runningRediscoverPromise = undefined);
    return this._runningRediscoverPromise;
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
      client.destroy();
    }

    if (this.pubSubNode) {
      this.pubSubNode.client.destroy();
      this.pubSubNode = undefined;
    }

    this._resetSlots();
    this.nodeByAddress.clear();
  }

  private *_clients() {
    for (const master of this.masters) {
      if (master.client) {
        yield master.client;
      }

      if (master.pubSub) {
        yield master.pubSub.client;
      }
    }

    for (const replica of this.replicas) {
      if (replica.client) {
        yield replica.client;
      }
    }
  }

  private async _destroy(fn: (client: RedisClientType<M, F, S, RESP>) => Promise<unknown>): Promise<void> {
    this._isOpen = false;

    const promises = [];
    for (const client of this._clients()) {
      promises.push(fn(client));
    }

    if (this.pubSubNode) {
      promises.push(fn(this.pubSubNode.client));
      this.pubSubNode = undefined;
    }

    this._resetSlots();
    this.nodeByAddress.clear();

    await Promise.allSettled(promises);
  }

  getClient(
    firstKey: RedisArgument | undefined,
    isReadonly: boolean | undefined
  ) {
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

  _randomNodeIterator?: IterableIterator<ShardNode<M, F, S, RESP, TYPE_MAPPING>>;

  getRandomNode() {
    this._randomNodeIterator ??= this._iterateAllNodes();
    return this._randomNodeIterator.next().value as ShardNode<M, F, S, RESP, TYPE_MAPPING>;
  }

  private *_slotNodesIterator(slot: ShardWithReplicas<M, F, S, RESP, TYPE_MAPPING>) {
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

    slot.nodesIterator ??= this._slotNodesIterator(slot as ShardWithReplicas<M, F, S, RESP, TYPE_MAPPING>);
    return slot.nodesIterator.next().value as ShardNode<M, F, S, RESP, TYPE_MAPPING>;
  }

  getMasterByAddress(address: string) {
    const master = this.nodeByAddress.get(address);
    if (!master) return;

    return this.nodeClient(master);
  }

  getPubSubClient() {
    if (!this.pubSubNode) return this._initiatePubSubClient();

    return this.pubSubNode.connectPromise ?? this.pubSubNode.client;
  }

  private async _initiatePubSubClient(toResubscribe?: PubSubToResubscribe) {
    const index = Math.floor(Math.random() * (this.masters.length + this.replicas.length)),
      node = index < this.masters.length ?
        this.masters[index] :
        this.replicas[index - this.masters.length],
        client = this._createClient(node, true);
      
    this.pubSubNode = {
      address: node.address,
      client,
      connectPromise: client.connect()
        .then(async client => {
          if (toResubscribe) {
            await Promise.all([
              client.extendPubSubListeners(PubSubType.CHANNELS, toResubscribe[PubSubType.CHANNELS]),
              client.extendPubSubListeners(PubSubType.PATTERNS, toResubscribe[PubSubType.PATTERNS])
            ]);
          }

          this.pubSubNode!.connectPromise = undefined;
          return client;
        })
        .catch(err => {
          this.pubSubNode = undefined;
          throw err;
        })
    };

    return this.pubSubNode.connectPromise!;
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
    if (!master.pubSub) return this._initiateShardedPubSubClient(master);
    return master.pubSub.connectPromise ?? master.pubSub.client;
  }

  private async _initiateShardedPubSubClient(master: MasterNode<M, F, S, RESP, TYPE_MAPPING>) {
    const client = this._createClient(master, true)
      .on('server-sunsubscribe', async (channel, listeners) => {
        try {
          await this.rediscover(client);
          const redirectTo = await this.getShardedPubSubClient(channel);
          await redirectTo.extendPubSubChannelListeners(
            PubSubType.SHARDED,
            channel,
            listeners
          );
        } catch (err) {
          this._emit('sharded-shannel-moved-error', err, channel, listeners);
        }
      });

    master.pubSub = {
      client,
      connectPromise: client.connect()
        .then(client => {
          master.pubSub!.connectPromise = undefined;
          return client;
        })
        .catch(err => {
          master.pubSub = undefined;
          throw err;
        })
    };

    return master.pubSub.connectPromise!;
  }

  async executeShardedUnsubscribeCommand(
    channel: string,
    unsubscribe: (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>) => Promise<void>
  ) {
    const { master } = this.slots[calculateSlot(channel)];
    if (!master.pubSub) return;

    const client = master.pubSub.connectPromise ?
      await master.pubSub.connectPromise :
      master.pubSub.client;

    await unsubscribe(client);

    if (!client.isPubSubActive) {
      client.destroy();
      master.pubSub = undefined;
    }
  }
}
