import { RedisClusterClientOptions, RedisClusterOptions } from '.';
import { RootNodesUnavailableError } from '../errors';
import RedisClient, { RedisClientOptions, RedisClientType } from '../client';
import { EventEmitter } from 'node:stream';
import { ChannelListeners, PUBSUB_TYPE, PubSubListeners, PubSubTypeListeners } from '../client/pub-sub';
import { RedisArgument, RedisFunctions, RedisModules, RedisScripts, RespVersions, TypeMapping } from '../RESP/types';
import calculateSlot from 'cluster-key-slot';
import { RedisSocketOptions } from '../client/socket';
import { BasicPooledClientSideCache, PooledClientSideCacheProvider } from '../client/cache';
import { SMIGRATED_EVENT, SMigratedEvent, dbgMaintenance } from '../client/enterprise-maintenance-manager';

interface NodeAddress {
  host: string;
  port: number;
}

export type NodeAddressMap = {
  [address: string]: NodeAddress;
} | ((address: string) => NodeAddress | undefined);

export const RESUBSCRIBE_LISTENERS_EVENT = '__resubscribeListeners'

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
    Omit<Node<M, F, S, RESP, TYPE_MAPPING>, 'client'> &
    Required<Pick<Node<M, F, S, RESP, TYPE_MAPPING>, 'client'>>
  );

type PubSubToResubscribe = Record<
  PUBSUB_TYPE['CHANNELS'] | PUBSUB_TYPE['PATTERNS'],
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
  static #SLOTS = 16384;

  readonly #options;
  readonly #clientFactory;
  readonly #emit: EventEmitter['emit'];
  slots = new Array<Shard<M, F, S, RESP, TYPE_MAPPING>>(RedisClusterSlots.#SLOTS);
  masters = new Array<MasterNode<M, F, S, RESP, TYPE_MAPPING>>();
  replicas = new Array<ShardNode<M, F, S, RESP, TYPE_MAPPING>>();
  readonly nodeByAddress = new Map<string, MasterNode<M, F, S, RESP, TYPE_MAPPING> | ShardNode<M, F, S, RESP, TYPE_MAPPING>>();
  pubSubNode?: PubSubNode<M, F, S, RESP, TYPE_MAPPING>;
  clientSideCache?: PooledClientSideCacheProvider;
  smigratedSeqIdsSeen = new Set<number>;

  #isOpen = false;

  get isOpen() {
    return this.#isOpen;
  }

  #validateOptions(options?: RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING>) {
    if (options?.clientSideCache && options?.RESP !== 3) {
      throw new Error('Client Side Caching is only supported with RESP3');
    }
  }

  constructor(
    options: RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING>,
    emit: EventEmitter['emit']
  ) {
    this.#validateOptions(options);
    this.#options = options;

    if (options?.clientSideCache) {
      if (options.clientSideCache instanceof PooledClientSideCacheProvider) {
        this.clientSideCache = options.clientSideCache;
      } else {
        this.clientSideCache = new BasicPooledClientSideCache(options.clientSideCache)
      }
    }

    this.#clientFactory = RedisClient.factory(this.#options);
    this.#emit = emit;
  }

  async connect() {
    if (this.#isOpen) {
      throw new Error('Cluster already open');
    }

    this.#isOpen = true;
    try {
      await this.#discoverWithRootNodes();
      this.#emit('connect');
    } catch (err) {
      this.#isOpen = false;
      throw err;
    }
  }

  async #discoverWithRootNodes() {
    let start = Math.floor(Math.random() * this.#options.rootNodes.length);
    for (let i = start; i < this.#options.rootNodes.length; i++) {
      if (!this.#isOpen) throw new Error('Cluster closed');
      if (await this.#discover(this.#options.rootNodes[i])) return;
    }

    for (let i = 0; i < start; i++) {
      if (!this.#isOpen) throw new Error('Cluster closed');
      if (await this.#discover(this.#options.rootNodes[i])) return;
    }

    throw new RootNodesUnavailableError();
  }

  #resetSlots() {
    this.slots = new Array(RedisClusterSlots.#SLOTS);
    this.masters = [];
    this.replicas = [];
    this._randomNodeIterator = undefined;
  }

  async #discover(rootNode: RedisClusterClientOptions) {
    this.clientSideCache?.clear();
    this.clientSideCache?.disable();

    try {
      const addressesInUse = new Set<string>(),
        promises: Array<Promise<unknown>> = [],
        eagerConnect = this.#options.minimizeConnections !== true;

      const shards = await this.#getShards(rootNode);
      dbgMaintenance(shards);
      this.#resetSlots(); // Reset slots AFTER shards have been fetched to prevent a race condition
      for (const { from, to, master, replicas } of shards) {
        const shard: Shard<M, F, S, RESP, TYPE_MAPPING> = {
          master: this.#initiateSlotNode(master, false, eagerConnect, addressesInUse, promises)
        };

        if (this.#options.useReplicas) {
          shard.replicas = replicas.map(replica =>
            this.#initiateSlotNode(replica, true, eagerConnect, addressesInUse, promises)
          );
        }

        for (let i = from; i <= to; i++) {
          this.slots[i] = shard;
        }
      }

      if (this.pubSubNode && !addressesInUse.has(this.pubSubNode.address)) {
        const channelsListeners = this.pubSubNode.client.getPubSubListeners(PUBSUB_TYPE.CHANNELS),
          patternsListeners = this.pubSubNode.client.getPubSubListeners(PUBSUB_TYPE.PATTERNS);

        this.pubSubNode.client.destroy();

        if (channelsListeners.size || patternsListeners.size) {
          promises.push(
            this.#initiatePubSubClient({
              [PUBSUB_TYPE.CHANNELS]: channelsListeners,
              [PUBSUB_TYPE.PATTERNS]: patternsListeners
            })
          );
        }
      }

      //Keep only the nodes that are still in use
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
      this.clientSideCache?.enable();

      return true;
    } catch (err) {
      this.#emit('error', err);
      return false;
    }
  }

  #handleSmigrated = async (event: SMigratedEvent) => {
    dbgMaintenance(`[CSlots]: handle smigrated`, JSON.stringify(event, null, 2));

    if(this.smigratedSeqIdsSeen.has(event.seqId)) {
      dbgMaintenance(`[CSlots]: sequence id ${event.seqId} already seen, abort`)
      return
    }
    this.smigratedSeqIdsSeen.add(event.seqId);

    const sourceAddress = `${event.source.host}:${event.source.port}`;
    const sourceNode = this.nodeByAddress.get(sourceAddress);
    if(!sourceNode) {
      dbgMaintenance(`[CSlots]: address ${sourceAddress} not in 'nodeByAddress', abort SMIGRATED handling`);
      return;
    }

    // 1. Pausing
    // 1.1 Normal
    sourceNode.client?._pause();
    // 1.2 Sharded pubsub
    if('pubSub' in sourceNode) {
      sourceNode.pubSub?.client._pause();
    }

    for(const {host, port, slots} of event.destinations) {
      const destinationAddress = `${host}:${port}`;
      let destMasterNode: MasterNode<M, F, S, RESP, TYPE_MAPPING> | undefined = this.nodeByAddress.get(destinationAddress);
      let destShard: Shard<M, F, S, RESP, TYPE_MAPPING>;
      // 2. Create new Master
      if(!destMasterNode) {
        const promises: Promise<unknown>[] = [];
        destMasterNode = this.#initiateSlotNode({ host: host, port: port, id: 'asdff' }, false, true, new Set(), promises);
        await Promise.all([...promises, this.#initiateShardedPubSubClient(destMasterNode)]);
        // 2.1 Pause
        destMasterNode.client?._pause();
        destMasterNode.pubSub?.client._pause();
        // In case destination node didnt exist, this means Shard didnt exist as well, so creating a new Shard is completely fine
        destShard = {
          master: destMasterNode
        };
      } else {
        // In case destination node existed, this means there was a Shard already, so its best if we can find it.
        const existingShard = this.slots.find(shard => shard.master.host === host && shard.master.port === port);
        if(!existingShard) {
          dbgMaintenance("Could not find shard");
          throw new Error('Could not find shard');
        }
        destShard = existingShard;
      }
      // 3. Soft update shards.
      // After this step we are expecting any new commands that hash to the same slots to be routed to the destinationShard
      const movingSlots = new Set<number>();
      for(const slot of slots) {
        if(typeof slot === 'number') {
          this.slots[slot] = destShard;
          movingSlots.add(slot)
        } else {
          for (let s = slot[0]; s <= slot[1]; s++) {
            this.slots[s] = destShard;
            movingSlots.add(s)
          }
        }
      }

      // 4. For all affected clients (normal, pubsub, spubsub):
      // 4.1 Wait for inflight commands to complete
      const inflightPromises: Promise<void>[] = [];
      //Normal
      inflightPromises.push(sourceNode.client!._getQueue().waitForInflightCommandsToComplete());
      //Sharded pubsub
      if('pubSub' in sourceNode) {
        inflightPromises.push(sourceNode.pubSub!.client._getQueue().waitForInflightCommandsToComplete());
      }
      //Regular pubsub
      if(this.pubSubNode?.address === sourceAddress) {
        inflightPromises.push(this.pubSubNode?.client._getQueue().waitForInflightCommandsToComplete());
      }
      await Promise.all(inflightPromises);


      // 4.2 Extract commands, channels, sharded channels
      // TODO dont forget to extract channels and resubscribe
      const sourceStillHasSlots = this.slots.find(slot => slot.master.address === sourceAddress) !== undefined;
      // If source shard still has slots, this means we have to only extract commands for the moving slots.
      // Commands that are for different slots or have no slots should stay in the source shard.
      // Same goes for sharded pub sub listeners
      if(sourceStillHasSlots) {
        const normalCommandsToMove = sourceNode.client!._getQueue().extractCommandsForSlots(movingSlots);
        // 5. Prepend extracted commands, chans
        //TODO pubsub, spubsub
        destMasterNode.client?._getQueue().prependCommandsToWrite(normalCommandsToMove);
        sourceNode.client?._unpause();
        if('pubSub' in sourceNode) {
          const listeners = sourceNode.pubSub?.client._getQueue().removeShardedPubSubListenersForSlots(movingSlots);
          this.#emit(RESUBSCRIBE_LISTENERS_EVENT, listeners);
          sourceNode.pubSub?.client._unpause();
        }
      } else {
        // If source shard doesnt have any slots left, this means we can safely move all commands to the new shard.
        // Same goes for sharded pub sub listeners
        const normalCommandsToMove = sourceNode.client!._getQueue().extractAllCommands();
        // 5. Prepend extracted commands, chans
        destMasterNode.client?._getQueue().prependCommandsToWrite(normalCommandsToMove);
        if('pubSub' in sourceNode) {
          const listeners = sourceNode.pubSub?.client._getQueue().removeAllPubSubListeners();
          this.#emit(RESUBSCRIBE_LISTENERS_EVENT, listeners);
        }

        //Remove all local references to the dying shard's clients
        this.masters = this.masters.filter(master => master.address !== sourceAddress);
        //not sure if needed, since there should be no replicas in RE
        this.replicas = this.replicas.filter(replica => replica.address !== sourceAddress);
        this.nodeByAddress.delete(sourceAddress);

        // 4.3 Kill because no slots are pointing to it anymore
        if (sourceNode.client?.isOpen) {
          await sourceNode.client?.close()
        }
        if('pubSub' in sourceNode) {
          if (sourceNode.pubSub?.client.isOpen) {
            await sourceNode.pubSub?.client.close();
          }
        }
      }

      // 5.1 Unpause
      destMasterNode.client?._unpause();
      if('pubSub' in destMasterNode) {
        destMasterNode.pubSub?.client._unpause();
      }

      // We want to replace the pubSubNode ONLY if it is pointing to the affected node AND the affected
      // node is actually dying ( designated by the fact that there are no remaining slots assigned to it)
      if(this.pubSubNode?.address === sourceAddress && !sourceStillHasSlots) {
        const channelsListeners = this.pubSubNode.client.getPubSubListeners(PUBSUB_TYPE.CHANNELS),
          patternsListeners = this.pubSubNode.client.getPubSubListeners(PUBSUB_TYPE.PATTERNS);

        this.pubSubNode.client.destroy();

        // Only create the new pubSubNode if there are actual subscriptions to make.
        // It will be lazily created later if needed.
        if (channelsListeners.size || patternsListeners.size) {
          await this.#initiatePubSubClient({
            [PUBSUB_TYPE.CHANNELS]: channelsListeners,
            [PUBSUB_TYPE.PATTERNS]: patternsListeners
          })
        }
      }
    }
  }

  async #getShards(rootNode: RedisClusterClientOptions) {
    const options = this.#clientOptionsDefaults(rootNode)!;
    options.socket ??= {};
    options.socket.reconnectStrategy = false;
    options.RESP = this.#options.RESP;
    options.commandOptions = undefined;
    options.maintNotifications = 'disabled';

    // TODO: find a way to avoid type casting
    const client = await this.#clientFactory(options as RedisClientOptions<M, F, S, RESP, {}>)
      .on('error', err => this.#emit('error', err))
      .connect();

    try {
      // switch to `CLUSTER SHARDS` when Redis 7.0 will be the minimum supported version
      return await client.clusterSlots();
    } finally {
      client.destroy();
    }
  }

  #getNodeAddress(address: string): NodeAddress | undefined {
    switch (typeof this.#options.nodeAddressMap) {
      case 'object':
        return this.#options.nodeAddressMap[address];

      case 'function':
        return this.#options.nodeAddressMap(address);
    }
  }

  #clientOptionsDefaults(options?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>) {
    if (!this.#options.defaults) return options;

    let socket;
    if (this.#options.defaults.socket) {
      socket = {
        ...this.#options.defaults.socket,
        ...options?.socket
      };
    } else {
      socket = options?.socket;
    }

    return {
      ...this.#options.defaults,
      ...options,
      socket: socket as RedisSocketOptions
    };
  }

  #initiateSlotNode(
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
        promises.push(this.#createNodeClient(node));
      }

      this.nodeByAddress.set(address, node);
    }

    if (!addressesInUse.has(address)) {
      addressesInUse.add(address);
      (readonly ? this.replicas : this.masters).push(node);
    }

    return node;
  }

  #createClient(node: ShardNode<M, F, S, RESP, TYPE_MAPPING>, readonly = node.readonly) {
    const socket =
      this.#getNodeAddress(node.address) ??
      { host: node.host, port: node.port, };
    const clientInfo = Object.freeze({
      host: socket.host,
      port: socket.port,
    });
    const emit = this.#emit;
    const client = this.#clientFactory( this.#clientOptionsDefaults({
        clientSideCache: this.clientSideCache,
        RESP: this.#options.RESP,
        socket,
        readonly,
      }))
      .on('error', error => emit('node-error', error, clientInfo))
      .on('reconnecting', () => emit('node-reconnecting', clientInfo))
      .once('ready', () => emit('node-ready', clientInfo))
      .once('connect', () => emit('node-connect', clientInfo))
      .once('end', () => emit('node-disconnect', clientInfo))
      .on(SMIGRATED_EVENT, this.#handleSmigrated)
      .on('__MOVED', async (allPubSubListeners: PubSubListeners) => {
        await this.rediscover(client);
        this.#emit(RESUBSCRIBE_LISTENERS_EVENT, allPubSubListeners);
      });

    return client;
  }

  #createNodeClient(node: ShardNode<M, F, S, RESP, TYPE_MAPPING>, readonly?: boolean) {
    const client = node.client = this.#createClient(node, readonly);
    return node.connectPromise = client.connect()
      .finally(() => node.connectPromise = undefined);
  }

  nodeClient(node: ShardNode<M, F, S, RESP, TYPE_MAPPING>) {
    return (
      node.connectPromise ?? // if the node is connecting
      (node.client ? Promise.resolve(node.client) : undefined) ?? // if the node is connected
      this.#createNodeClient(node) // if the not is disconnected
    );
  }

  #runningRediscoverPromise?: Promise<void>;

  async rediscover(startWith: RedisClientType<M, F, S, RESP>): Promise<void> {
    this.#runningRediscoverPromise ??= this.#rediscover(startWith)
      .finally(() => {
        this.#runningRediscoverPromise = undefined
      });
    return this.#runningRediscoverPromise;
  }

  async #rediscover(startWith: RedisClientType<M, F, S, RESP>): Promise<void> {
    if (await this.#discover(startWith.options!)) return;

    return this.#discoverWithRootNodes();
  }

  /**
   * @deprecated Use `close` instead.
   */
  quit(): Promise<void> {
    return this.#destroy(client => client.quit());
  }

  /**
   * @deprecated Use `destroy` instead.
   */
  disconnect(): Promise<void> {
    return this.#destroy(client => client.disconnect());
  }

  close() {
    return this.#destroy(client => client.close());
  }

  destroy() {
    this.#isOpen = false;

    for (const client of this.#clients()) {
      client.destroy();
    }

    if (this.pubSubNode) {
      this.pubSubNode.client.destroy();
      this.pubSubNode = undefined;
    }

    this.#resetSlots();
    this.nodeByAddress.clear();
    this.#emit('disconnect');
  }

  *#clients() {
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

  async #destroy(fn: (client: RedisClientType<M, F, S, RESP>) => Promise<unknown>): Promise<void> {
    this.#isOpen = false;

    const promises = [];
    for (const client of this.#clients()) {
      promises.push(fn(client));
    }

    if (this.pubSubNode) {
      promises.push(fn(this.pubSubNode.client));
      this.pubSubNode = undefined;
    }

    this.#resetSlots();
    this.nodeByAddress.clear();

    await Promise.allSettled(promises);
    this.#emit('disconnect');
  }

  async getClientAndSlotNumber(
    firstKey: RedisArgument | undefined,
    isReadonly: boolean | undefined
  ): Promise<{
    client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
    slotNumber?: number
  }> {
    if (!firstKey) {
      return {
        client: await this.nodeClient(this.getRandomNode())
      };
    }

    const slotNumber = calculateSlot(firstKey);
    if (!isReadonly) {
      return {
        client: await this.nodeClient(this.slots[slotNumber].master),
        slotNumber
      };
    }

    return {
      client: await this.nodeClient(this.getSlotRandomNode(slotNumber))
    };
  }

  *#iterateAllNodes() {
    if(this.masters.length + this.replicas.length === 0) return
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
    this._randomNodeIterator ??= this.#iterateAllNodes();
    return this._randomNodeIterator.next().value as ShardNode<M, F, S, RESP, TYPE_MAPPING>;
  }

  *#slotNodesIterator(slot: ShardWithReplicas<M, F, S, RESP, TYPE_MAPPING>) {
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

    slot.nodesIterator ??= this.#slotNodesIterator(slot as ShardWithReplicas<M, F, S, RESP, TYPE_MAPPING>);
    return slot.nodesIterator.next().value as ShardNode<M, F, S, RESP, TYPE_MAPPING>;
  }

  getMasterByAddress(address: string) {
    const master = this.nodeByAddress.get(address);
    if (!master) return;

    return this.nodeClient(master);
  }

  getPubSubClient() {
    if (!this.pubSubNode) return this.#initiatePubSubClient();

    return this.pubSubNode.connectPromise ?? this.pubSubNode.client;
  }

  async #initiatePubSubClient(toResubscribe?: PubSubToResubscribe) {
    const index = Math.floor(Math.random() * (this.masters.length + this.replicas.length)),
      node = index < this.masters.length ?
        this.masters[index] :
        this.replicas[index - this.masters.length],
      client = this.#createClient(node, false);

    this.pubSubNode = {
      address: node.address,
      client,
      connectPromise: client.connect()
        .then(async client => {
          if (toResubscribe) {
            await Promise.all([
              client.extendPubSubListeners(PUBSUB_TYPE.CHANNELS, toResubscribe[PUBSUB_TYPE.CHANNELS]),
              client.extendPubSubListeners(PUBSUB_TYPE.PATTERNS, toResubscribe[PUBSUB_TYPE.PATTERNS])
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
    if (!master.pubSub) return this.#initiateShardedPubSubClient(master);
    return master.pubSub.connectPromise ?? master.pubSub.client;
  }

  async #initiateShardedPubSubClient(master: MasterNode<M, F, S, RESP, TYPE_MAPPING>) {
    const client = this.#createClient(master, false)
      .on('server-sunsubscribe', async (channel, listeners) => {
        try {
          await this.rediscover(client);
          const redirectTo = await this.getShardedPubSubClient(channel);
          await redirectTo.extendPubSubChannelListeners(
            PUBSUB_TYPE.SHARDED,
            channel,
            listeners
          );
        } catch (err) {
          this.#emit('sharded-shannel-moved-error', err, channel, listeners);
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
