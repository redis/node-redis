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
      if (await this.#discover(this.#options.rootNodes[i])) {
        return;
      }
    }

    for (let i = 0; i < start; i++) {
      if (!this.#isOpen) throw new Error('Cluster closed');
      if (await this.#discover(this.#options.rootNodes[i])) {
        return;
      }
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

    for (const entry of event.entries) {
      const sourceAddress = `${entry.source.host}:${entry.source.port}`;
      const sourceNode = this.nodeByAddress.get(sourceAddress);
      dbgMaintenance(`[CSlots]: Looking for sourceAddress=${sourceAddress}. Available addresses in nodeByAddress: ${Array.from(this.nodeByAddress.keys()).join(', ')}`);
      if (!sourceNode) {
        dbgMaintenance(`[CSlots]: address ${sourceAddress} not in 'nodeByAddress', skipping this entry`);
        continue;
      }
      if (sourceNode.client === undefined) {
        dbgMaintenance(`[CSlots]: Node for ${sourceAddress} does not have a client, skipping this entry`);
        continue;
      }

      // Track all slots being moved for this entry (used for pubsub listener handling)
      const allMovingSlots = new Set<number>();

      try {
        // 1. Pausing
        // 1.1 Normal
        sourceNode.client?._pause();
        // 1.2 Sharded pubsub
        if ('pubSub' in sourceNode) {
          sourceNode.pubSub?.client._pause();
        }

        // 2. Process each destination: create nodes, update slot mappings, extract commands, unpause
        let lastDestNode: MasterNode<M, F, S, RESP, TYPE_MAPPING> | undefined;
        for (const { addr: { host, port }, slots } of entry.destinations) {
          const destinationAddress = `${host}:${port}`;
          let destMasterNode: MasterNode<M, F, S, RESP, TYPE_MAPPING> | undefined = this.nodeByAddress.get(destinationAddress);
          dbgMaintenance(`[CSlots]: Looking for destAddress=${destinationAddress}. Found in nodeByAddress: ${destMasterNode ? 'YES' : 'NO'}`);
          let destShard: Shard<M, F, S, RESP, TYPE_MAPPING>;

          // 2.1 Create new Master if needed
          if (!destMasterNode) {
            const promises: Promise<unknown>[] = [];
            destMasterNode = this.#initiateSlotNode({ host: host, port: port, id: `smigrated-${host}:${port}` }, false, true, new Set(), promises);
            await Promise.all([...promises, this.#initiateShardedPubSubClient(destMasterNode)]);
            // Pause new destination until migration is complete
            destMasterNode.client?._pause();
            destMasterNode.pubSub?.client._pause();
            // In case destination node didnt exist, this means Shard didnt exist as well, so creating a new Shard is completely fine
            destShard = {
              master: destMasterNode
            };
          } else {
            // DEBUG: Log all master hosts/ports in slots array to diagnose mismatch
            const allMasters = [...new Set(this.slots)].map(s => `${s.master.host}:${s.master.port}`);
            dbgMaintenance(`[CSlots]: Searching for shard with host=${host}, port=${port}. Available masters in slots: ${allMasters.join(', ')}`);
            // In case destination node existed, this means there was a Shard already, so its best if we can find it.
            const existingShard = this.slots.find(shard => shard.master.host === host && shard.master.port === port);
            if (!existingShard) {
              dbgMaintenance("Could not find shard");
              throw new Error('Could not find shard');
            }
            destShard = existingShard;
            // Pause existing destination during command transfer
            destMasterNode.client?._pause();
            destMasterNode.pubSub?.client._pause();
          }

          // Track last destination for slotless commands later
          lastDestNode = destMasterNode;

          // 3. Convert slots to Set and update shard mappings
          const destinationSlots = new Set<number>();
          for (const slot of slots) {
            if (typeof slot === 'number') {
              this.slots[slot] = destShard;
              destinationSlots.add(slot);
              allMovingSlots.add(slot);
            } else {
              for (let s = slot[0]; s <= slot[1]; s++) {
                this.slots[s] = destShard;
                destinationSlots.add(s);
                allMovingSlots.add(s);
              }
            }
          }
          dbgMaintenance(`[CSlots]: Updated slots to point to destination ${destMasterNode.address}. Sample slots: ${Array.from(slots).slice(0, 5).join(', ')}${slots.length > 5 ? '...' : ''}`);

          // 4. Extract commands for this destination's slots and prepend to destination queue
          const commandsForDestination = sourceNode.client._getQueue().extractCommandsForSlots(destinationSlots);
          destMasterNode.client?._getQueue().prependCommandsToWrite(commandsForDestination);
          dbgMaintenance(`[CSlots]: Extracted ${commandsForDestination.length} commands for ${destinationSlots.size} slots, prepended to ${destMasterNode.address}`);

          // 5. Unpause destination
          destMasterNode.client?._unpause();
          destMasterNode.pubSub?.client._unpause();
        }

        dbgMaintenance(`[CSlots]: Total ${allMovingSlots.size} slots moved from ${sourceAddress}. Sample: ${Array.from(allMovingSlots).slice(0, 10).join(', ')}${allMovingSlots.size > 10 ? '...' : ''}`);

        // 6. Wait for inflight commands on source to complete (with timeout to prevent hangs)
        const INFLIGHT_TIMEOUT_MS = 5000; // 5 seconds max wait for inflight commands
        const inflightPromises: Promise<void>[] = [];
        const inflightOptions = { timeoutMs: INFLIGHT_TIMEOUT_MS, flushOnTimeout: true };

        inflightPromises.push(sourceNode.client._getQueue().waitForInflightCommandsToComplete(inflightOptions));
        if ('pubSub' in sourceNode && sourceNode.pubSub !== undefined) {
          inflightPromises.push(sourceNode.pubSub.client._getQueue().waitForInflightCommandsToComplete(inflightOptions));
        }
        if (this.pubSubNode?.address === sourceAddress) {
          inflightPromises.push(this.pubSubNode.client._getQueue().waitForInflightCommandsToComplete(inflightOptions));
        }
        await Promise.all(inflightPromises);

        // 7. Handle source cleanup
        const sourceStillHasSlots = this.slots.find(slot => slot.master.address === sourceAddress) !== undefined;

        if (sourceStillHasSlots) {
          // Handle sharded pubsub listeners for moving slots
          if ('pubSub' in sourceNode) {
            const listeners = sourceNode.pubSub?.client._getQueue().removeShardedPubSubListenersForSlots(allMovingSlots);
            this.#emit(RESUBSCRIBE_LISTENERS_EVENT, listeners);
          }

          // Unpause source since it still has slots
          sourceNode.client?._unpause();
          if ('pubSub' in sourceNode) {
            sourceNode.pubSub?.client._unpause();
          }
        } else {
          // Source has no slots left - move remaining slotless commands and cleanup
          const remainingCommands = sourceNode.client._getQueue().extractAllCommands();
          if (remainingCommands.length > 0 && lastDestNode) {
            lastDestNode.client?._getQueue().prependCommandsToWrite(remainingCommands);
            dbgMaintenance(`[CSlots]: Moved ${remainingCommands.length} remaining slotless commands to ${lastDestNode.address}`);
          }

          if ('pubSub' in sourceNode) {
            const listeners = sourceNode.pubSub?.client._getQueue().removeAllPubSubListeners();
            this.#emit(RESUBSCRIBE_LISTENERS_EVENT, listeners);
          }

          // Remove all local references to the dying shard's clients
          this.masters = this.masters.filter(master => master.address !== sourceAddress);
          this.replicas = this.replicas.filter(replica => replica.address !== sourceAddress);
          this.nodeByAddress.delete(sourceAddress);

          // Handle pubSubNode replacement BEFORE destroying source connections
          // This ensures subscriptions are resubscribed on a new node before the old connection is lost
          if (this.pubSubNode?.address === sourceAddress) {
            const channelsListeners = this.pubSubNode.client.getPubSubListeners(PUBSUB_TYPE.CHANNELS),
              patternsListeners = this.pubSubNode.client.getPubSubListeners(PUBSUB_TYPE.PATTERNS);

            const oldPubSubClient = this.pubSubNode.client;

            if (channelsListeners.size || patternsListeners.size) {
              await this.#initiatePubSubClient({
                [PUBSUB_TYPE.CHANNELS]: channelsListeners,
                [PUBSUB_TYPE.PATTERNS]: patternsListeners
              });
            } else {
              this.pubSubNode = undefined;
            }

            oldPubSubClient.destroy();
          }

          // Destroy source connections (use destroy() instead of close() since the node is being removed
          // and close() can hang if the server is not responding)
          sourceNode.client?.destroy();
          if ('pubSub' in sourceNode) {
            sourceNode.pubSub?.client.destroy();
          }
        }
      } catch (err: any) {
        dbgMaintenance(`[CSlots]: Error during SMIGRATED handling for source ${sourceAddress}: ${err}`);
        // Ensure we unpause source on error to prevent deadlock
        sourceNode.client?._unpause();
        if ('pubSub' in sourceNode) {
          sourceNode.pubSub?.client._unpause();
        }
        this.#emit(err.message)
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

  nodeClient(node: ShardNode<M, F, S, RESP, TYPE_MAPPING>): Promise<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> {
    // if the node is connecting
    if (node.connectPromise)
      return node.connectPromise;
    // if the node is connected
    if (node.client)
      return Promise.resolve(node.client);
    // if the not is disconnected
    return this.#createNodeClient(node)
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
      client: await this.nodeClient(this.getSlotRandomNode(slotNumber)),
      slotNumber
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

  getPubSubClient(): Promise<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> {
    if (!this.pubSubNode) return this.#initiatePubSubClient();

    return this.pubSubNode.connectPromise ?? Promise.resolve(this.pubSubNode.client);
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

  getShardedPubSubClient(channel: string): Promise<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> {
    const { master } = this.slots[calculateSlot(channel)];
    if (!master.pubSub) return this.#initiateShardedPubSubClient(master);
    return master.pubSub.connectPromise ?? Promise.resolve(master.pubSub.client);
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
