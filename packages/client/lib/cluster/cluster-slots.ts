import type { RedisClusterClientOptions, RedisClusterOptions } from '.';
import { ClientClosedError, ClientOfflineError, DisconnectsClientError, ErrorReply, MaxCommandRedirectionsError, RootNodesUnavailableError, TimeoutError } from '../errors';
import RedisClient, { RedisClientOptions, RedisClientType } from '../client';
import type { CommandToWrite } from '../client/commands-queue';
import { EventEmitter } from 'node:stream';
import { ChannelListeners, PUBSUB_TYPE, PubSubListeners, PubSubTypeListeners } from '../client/pub-sub';
import { RedisArgument, RedisFunctions, RedisModules, RedisScripts, RespVersions, TypeMapping, DEFAULT_RESP } from '../RESP/types';
import calculateSlot from '../utils/calculate-slot';
import { RedisSocketOptions } from '../client/socket';
import { BasicPooledClientSideCache, PooledClientSideCacheProvider } from '../client/cache';
import { SMIGRATED_EVENT, SMigratedEvent, dbgMaintenance } from '../client/enterprise-maintenance-manager';
import { ClientRole } from '../client/identity';
import ClusterReconnectionTracker from './cluster-reconnection-tracker';
import { FieldsetRegistry } from '../himport/registry';

interface NodeAddress {
  host: string;
  port: number;
}

export type NodeAddressMap = {
  [address: string]: NodeAddress;
} | ((address: string) => NodeAddress | undefined);

export const RESUBSCRIBE_LISTENERS_EVENT = '__resubscribeListeners'

/**
 * Sticky-cursor binding: which node served a RediSearch cursor. FT.CURSOR
 * READ/DEL carry no key, so hash-slot routing can't reach the coordinator that
 * minted the cursor — we pin by `address` ("host:port"), the durable handle
 * (clients are recreated on reconnect/topology refresh, addresses aren't).
 */
export interface CursorBinding {
  address: string;
  /**
   * The server's real cursor id, kept as a string: FT cursor ids are uint64
   * and `Number` would lose precision above 2^53. The caller only ever sees
   * the client-minted token this binding is keyed by.
   */
  cursorId: string;
  createdAt: number;
  maxIdleMs?: number;
}

/**
 * Fallback idle TTL for the opportunistic cursor-binding sweep when the
 * FT.AGGREGATE didn't declare MAXIDLE. Mirrors the RediSearch default (300s)
 * so abandoned cursors don't leak the binding map (timer-free, like
 * `smigratedSeqIdsSeen`).
 */
const DEFAULT_CURSOR_MAX_IDLE_MS = 300_000;

/**
 * One in-flight cluster-wide SCAN-family chain (see
 * `request-response-policies/scan-cursor.ts`) — shared by every command with
 * this per-node-cursor shape (SCAN, BLESS SCAN, ...). Cursors are per-node
 * state, so a cluster-wide iteration walks the masters one at a time: the
 * entry pins the node currently being scanned, the real server cursor to
 * resume it with, the masters already exhausted (tracked by address so a
 * topology refresh mid-scan doesn't rescan or skip nodes that survived), and
 * the wire label of the command that started the chain — tokens are minted
 * from one shared counter, so a lookup must reject a token that was minted by
 * a *different* command instead of resuming its chain with the wrong cursor.
 */
export interface ScanCursorEntry {
  address: string;
  cursor: string;
  visited: Set<string>;
  createdAt: number;
  // Wire label ('SCAN', 'BLESS SCAN', ...) of the command that minted this
  // token
  label: string;
}

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
    Required<Pick<Node<M, F, S, RESP, TYPE_MAPPING>, 'client'>> & {
      // Listeners waiting to be applied after connect. Kept here so a later
      // rediscover can still recover them if connect has not finished yet.
      pendingToResubscribe?: PubSubToResubscribe;
    }
  );

type PubSubToResubscribe = Record<
  PUBSUB_TYPE['CHANNELS'] | PUBSUB_TYPE['PATTERNS'],
  PubSubTypeListeners
>;

function mergePubSubTypeListeners(
  ...sources: Array<PubSubTypeListeners | undefined>
): PubSubTypeListeners {
  const merged: PubSubTypeListeners = new Map();
  for (const source of sources) {
    if (!source?.size) continue;
    for (const [channel, listeners] of source) {
      const existing = merged.get(channel);
      if (!existing) {
        merged.set(channel, {
          unsubscribing: false,
          buffers: new Set(listeners.buffers),
          strings: new Set(listeners.strings)
        });
        continue;
      }
      for (const listener of listeners.buffers) existing.buffers.add(listener);
      for (const listener of listeners.strings) existing.strings.add(listener);
    }
  }
  return merged;
}

function pubSubNodeListenersToCarry<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
>(pubSubNode: PubSubNode<M, F, S, RESP, TYPE_MAPPING>): PubSubToResubscribe {
  const pending = pubSubNode.pendingToResubscribe;
  return {
    [PUBSUB_TYPE.CHANNELS]: mergePubSubTypeListeners(
      pubSubNode.client.getPubSubListeners(PUBSUB_TYPE.CHANNELS),
      pending?.[PUBSUB_TYPE.CHANNELS]
    ),
    [PUBSUB_TYPE.PATTERNS]: mergePubSubTypeListeners(
      pubSubNode.client.getPubSubListeners(PUBSUB_TYPE.PATTERNS),
      pending?.[PUBSUB_TYPE.PATTERNS]
    )
  };
}

export function groupCommandsByDestination<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
>(
  commands: CommandToWrite[],
  slots: Array<Shard<M, F, S, RESP, TYPE_MAPPING>>,
  fallback?: MasterNode<M, F, S, RESP, TYPE_MAPPING>
) {
  const byDestination = new Map<
    MasterNode<M, F, S, RESP, TYPE_MAPPING>,
    CommandToWrite[]
  >();
  // Commands with neither a resolvable slot owner nor a fallback - the
  // caller must settle these explicitly (e.g. reject them) instead of
  // silently dropping them, since they were already removed from the
  // source queue by the time this is called.
  const unrouted: CommandToWrite[] = [];

  for (const command of commands) {
    const destination = command.slotNumber === undefined ?
      fallback :
      slots[command.slotNumber]?.master ?? fallback;

    if (!destination) {
      unrouted.push(command);
      continue;
    }

    const group = byDestination.get(destination);
    if (group) {
      group.push(command);
    } else {
      byDestination.set(destination, [command]);
    }
  }

  return { byDestination, unrouted };
}

/**
 * Splits commands extracted from a dying node's queue into the queued tail of
 * a chain (MULTI/pipeline) whose head is already sent (out of view, in
 * `#waitingForReply`) and everything else, which is safe to relocate as-is.
 *
 * Only used on full node loss: the connection is about to be destroyed, so
 * the in-flight chain's tail is rejected rather than relocated - relocating a
 * fragment of an already-partially-sent chain would run it out of order or
 * split it across two connections. This doesn't apply to partial slot
 * migration, where the source connection survives and keeps its in-flight
 * chain intact.
 */
export function splitInFlightChainTail(
  commands: CommandToWrite[],
  chainInExecution: symbol | undefined
) {
  const inFlightChainTail = chainInExecution === undefined
    ? []
    : commands.filter(command => command.chainId === chainInExecution);
  const relocatable = inFlightChainTail.length === 0
    ? commands
    : commands.filter(command => command.chainId !== chainInExecution);

  return { inFlightChainTail, relocatable };
}

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
  readonly #clusterClientId: string;
  readonly #reconnectionTracker: ClusterReconnectionTracker;
  slots = new Array<Shard<M, F, S, RESP, TYPE_MAPPING>>(RedisClusterSlots.#SLOTS);
  masters = new Array<MasterNode<M, F, S, RESP, TYPE_MAPPING>>();
  replicas = new Array<ShardNode<M, F, S, RESP, TYPE_MAPPING>>();
  readonly nodeByAddress = new Map<string, MasterNode<M, F, S, RESP, TYPE_MAPPING> | ShardNode<M, F, S, RESP, TYPE_MAPPING>>();
  // Nodes dropped from the topology; fan-out may still hold them and must not reconnect.
  readonly #retiredNodes = new WeakSet<ShardNode<M, F, S, RESP, TYPE_MAPPING>>();
  pubSubNode?: PubSubNode<M, F, S, RESP, TYPE_MAPPING>;
  // Whole retry-loop promise so concurrent getPubSubClient callers join the
  // winner instead of rejecting on the first failed shard pick.
  #pubSubInitiatePromise?: Promise<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>;
  clientSideCache?: PooledClientSideCacheProvider;
  /**
   * One fieldset registry for the whole cluster: HIMPORT PREPARE fans out to all masters
   * via the policy layer, and every node client (including MOVED/rediscovered nodes and
   * SMIGRATED destinations) must lazily re-prepare from the same registrations.
   */
  readonly #himportRegistry: FieldsetRegistry;

  /** The cluster-wide registry, exposed so `RedisCluster.duplicate()` can share it. */
  get himportRegistry() {
    return this.#himportRegistry;
  }
  smigratedSeqIdsSeen = new Set<number>;
  /**
   * Per-instance sticky FT cursor bindings, keyed by the client-minted virtual
   * token (the value the caller holds in place of the server's cursor id).
   * Server cursor ids are minted per node and can collide across shards;
   * client tokens come from one sequence and cannot.
   */
  readonly cursorBindings = new Map<string, CursorBinding>();
  /** Per-instance cluster-wide SCAN chains, keyed by the virtual cursor token. */
  readonly scanCursors = new Map<string, ScanCursorEntry>();
  #cursorTokenSeq = 0;
  #topologyRefreshPromise?: Promise<boolean | void>;

  #isOpen = false;

  get isOpen() {
    return this.#isOpen;
  }

  #isReady = false;

  get isReady() {
    return this.#isReady;
  }

  #validateOptions(options?: RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING>) {
    if (options?.clientSideCache && (options?.RESP ?? DEFAULT_RESP) !== 3) {
      throw new Error('Client Side Caching is only supported with RESP3');
    }
  }

  constructor(
    options: RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING>,
    emit: EventEmitter['emit'],
    clusterClientId: string
  ) {
    this.#validateOptions(options);
    this.#options = options;
    this.#himportRegistry = options.himportRegistry ?? new FieldsetRegistry();
    this.#clusterClientId = clusterClientId;
    this.#reconnectionTracker = new ClusterReconnectionTracker(options.topologyRefreshOnReconnectionAttemptStrategy);

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
    this.#isReady = false;
    try {
      await this.#discoverWithRootNodes();
      // `destroy()` may have run while discovery was in flight; if so, this
      // resolution is stale and must not resurrect readiness for a session
      // that's already been torn down.
      if (this.#isOpen) {
        this.#isReady = true;
        this.#emit('connect');
      }
    } catch (err) {
      this.#isOpen = false;
      this.#isReady = false;
      throw err;
    }
  }

  async #discoverWithRootNodes() {
    const start = Math.floor(Math.random() * this.#options.rootNodes.length);
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

    // a destroy() during the last root node's discovery is a close, not an outage
    if (!this.#isOpen) throw new Error('Cluster closed');
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
        eagerConnect = this.#options.minimizeConnections !== true;

      const shards = await this.#getShards(rootNode);
      // destroy() may have run while the shards were in flight — building
      // node clients now would leak them past teardown
      if (!this.#isOpen) return false;
      this.#resetSlots(); // Reset slots AFTER shards have been fetched to prevent a race condition
      for (const { from, to, master, replicas } of shards) {
        const shard: Shard<M, F, S, RESP, TYPE_MAPPING> = {
          master: this.#initiateSlotNode(master, false, eagerConnect, addressesInUse)
        };

        if (this.#options.useReplicas) {
          shard.replicas = replicas.map(replica =>
            this.#initiateSlotNode(replica, true, eagerConnect, addressesInUse)
          );
        }

        for (let i = from; i <= to; i++) {
          this.slots[i] = shard;
        }
      }

      if (this.pubSubNode && !addressesInUse.has(this.pubSubNode.address)) {
        // Include pendingToResubscribe: listeners are only applied after connect,
        // so a second rediscover while still connecting must not drop them.
        const toResubscribe = pubSubNodeListenersToCarry(this.pubSubNode);
        const dying = this.pubSubNode;

        // Clear before destroy so the dedicated pub/sub `end` handler does not
        // treat this intentional teardown as an unexpected drop.
        this.pubSubNode = undefined;
        this.#reconnectionTracker.removeClient(dying.client._clientId);
        dying.client.destroy();

        if (
          toResubscribe[PUBSUB_TYPE.CHANNELS].size ||
          toResubscribe[PUBSUB_TYPE.PATTERNS].size
        ) {
          // Do not await — an unreachable pub/sub target must not block topology install.
          this.#initiatePubSubClient(toResubscribe).catch(err => {
            if (err instanceof ClientClosedError && this.#isOpen) return;
            if (this.#isOpen) this.#emit('error', err);
          });
        }
      }

      //Keep only the nodes that are still in use
      for (const [address, node] of this.nodeByAddress.entries()) {
        const inUse = addressesInUse.has(address),
          { pubSub } = node as MasterNode<M, F, S, RESP, TYPE_MAPPING>;
        // a master demoted to a replica stays, but loses its pub/sub client like an unused node
        const demotedWithPubSub = node.readonly && pubSub !== undefined;
        if (inUse && !demotedWithPubSub) continue;

        if (pubSub) {
          const listeners = pubSub.client._getQueue().removeAllPubSubListeners();
          if (listeners.CHANNELS.size || listeners.PATTERNS.size || listeners.SHARDED.size) {
            this.#emit(RESUBSCRIBE_LISTENERS_EVENT, listeners);
          }
        }

        if (!inUse && node.client) {
          this.#reconnectionTracker.removeClient(node.client._clientId);
          node.client.destroy();
          node.client = undefined;
        }

        if (pubSub) {
          this.#reconnectionTracker.removeClient(pubSub.client._clientId);
          pubSub.client.destroy();
          (node as MasterNode<M, F, S, RESP, TYPE_MAPPING>).pubSub = undefined;
        }

        if (!inUse) {
          // Drop in-flight connect state and retire the handle so a fan-out
          // still holding this object cannot reconnect or resolve undefined.
          node.connectPromise = undefined;
          this.#retiredNodes.add(node);
          this.nodeByAddress.delete(address);
        }
      }

      // Slot map is installed; node/pubsub connects run in the background so an
      // unreachable node cannot block connect()/rediscover under reconnectStrategy.
      this.clientSideCache?.enable();

      return true;
    } catch (err) {
      // after destroy() nobody may be listening for 'error' any more
      if (this.#isOpen) this.#emit('error', err);
      return false;
    }
  }

  #handleSmigrated = async (event: SMigratedEvent) => {
    dbgMaintenance(`[CSlots]: handle smigrated`, JSON.stringify(event, null, 2));

    if (this.smigratedSeqIdsSeen.has(event.seqId)) {
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
      // Destination nodes paused but not yet unpaused — must be flushed in the catch path.
      const pausedDestNodes = new Set<MasterNode<M, F, S, RESP, TYPE_MAPPING>>();

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
            destMasterNode = this.#initiateSlotNode({ host: host, port: port, id: `smigrated-${host}:${port}` }, false, true, new Set());
            // Eager connect is started in the background; wait briefly so the
            // migration can pause a live client — but do not hang forever under
            // default reconnectStrategy when the destination is unreachable.
            let timeoutId: ReturnType<typeof setTimeout> | undefined;
            try {
              await Promise.race([
                Promise.all([
                  destMasterNode.connectPromise ?? Promise.resolve(destMasterNode.client),
                  this.#initiateShardedPubSubClient(destMasterNode)
                ]),
                new Promise<never>((_, reject) => {
                  timeoutId = setTimeout(
                    () => reject(new TimeoutError()),
                    this.#connectTimeoutMs()
                  );
                })
              ]);
            } catch (err) {
              // Drop the never-ready ghost only if a concurrent topology refresh
              // has not already installed this node into the slot map — otherwise
              // #discardNode leaves those slots pointing at a retired handle.
              const installedInSlots = this.slots.some(shard =>
                shard?.master === destMasterNode ||
                shard?.replicas?.includes(destMasterNode)
              );
              if (!installedInSlots) {
                this.#discardNode(destMasterNode);
              }
              throw err;
            } finally {
              if (timeoutId !== undefined) clearTimeout(timeoutId);
            }
            // Pause new destination until migration is complete
            destMasterNode.client?._pause();
            destMasterNode.pubSub?.client._pause();
            pausedDestNodes.add(destMasterNode);
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
            pausedDestNodes.add(destMasterNode);
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
          //
          // Note: unlike the full-node-loss path below, this doesn't reject an
          // in-flight chain's queued tail - the source connection here isn't
          // destroyed, it keeps serving its remaining slots, so rejecting the
          // tail wouldn't undo whatever the server thinks is still an open
          // transaction on that connection. Instead, extractCommandsForSlots()
          // itself leaves an in-flight chain's tail (and anything queued after
          // it) on source to preserve ordering; see its docstring.
          const commandsForDestination = sourceNode.client._getQueue().extractCommandsForSlots(destinationSlots);
          if (commandsForDestination.length > 0) {
            if (destMasterNode.client) {
              destMasterNode.client._getQueue().prependCommandsToWrite(commandsForDestination);
              dbgMaintenance(`[CSlots]: Extracted ${commandsForDestination.length} commands for ${destinationSlots.size} slots, prepended to ${destMasterNode.address}`);
            } else {
              sourceNode.client._getQueue().rejectCommands(commandsForDestination, new DisconnectsClientError());
              dbgMaintenance(`[CSlots]: Rejected ${commandsForDestination.length} commands for ${destinationSlots.size} slots because ${destMasterNode.address} has no client`);
            }
          }

          // 5. Unpause destination
          destMasterNode.client?._unpause();
          destMasterNode.pubSub?.client._unpause();
          pausedDestNodes.delete(destMasterNode);
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
          // Source has no slots left - move remaining commands to their current slot owners
          const remainingCommands = sourceNode.client._getQueue().extractAllCommands();
          if (remainingCommands.length > 0) {
            // A chain (MULTI/pipeline) that's already partially written to the
            // socket has the rest of its commands sitting in `#waitingForReply`,
            // out of view. The tail still in `#toWrite` can't be safely
            // relocated on its own - it would run as a fragment of the
            // transaction on a different node than the part already sent.
            const chainInExecution = sourceNode.client._getQueue().chainInExecution;
            const { inFlightChainTail, relocatable } = splitInFlightChainTail(remainingCommands, chainInExecution);

            if (inFlightChainTail.length > 0) {
              sourceNode.client._getQueue().rejectCommands(inFlightChainTail, new DisconnectsClientError());
              dbgMaintenance(`[CSlots]: Rejected ${inFlightChainTail.length} commands from a chain already partially sent to the server, can't be safely relocated`);
            }

            if (relocatable.length > 0) {
              const { byDestination: commandsByDestination, unrouted } = groupCommandsByDestination(relocatable, this.slots, lastDestNode);

              if (unrouted.length > 0) {
                sourceNode.client._getQueue().rejectCommands(unrouted, new DisconnectsClientError());
                dbgMaintenance(`[CSlots]: Rejected ${unrouted.length} commands with no resolvable slot owner and no fallback destination`);
              }

              for (const [destNode, commands] of commandsByDestination) {
                if (destNode.client) {
                  destNode.client._getQueue().prependCommandsToWrite(commands);
                  // Trigger write scheduling since commands were added after destination was unpaused
                  destNode.client._unpause();
                  dbgMaintenance(`[CSlots]: Moved ${commands.length} remaining commands to ${destNode.address}`);
                } else {
                  sourceNode.client._getQueue().rejectCommands(commands, new DisconnectsClientError());
                  dbgMaintenance(`[CSlots]: Rejected ${commands.length} remaining commands because ${destNode.address} has no client`);
                }
              }
            }
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
            const oldPubSubClient = this.pubSubNode.client;
            // Pending-only: live maps are re-read from oldPubSubClient at apply
            // time so an UNSUBSCRIBE that completes during the wait is not revived.
            const pendingOnly = this.pubSubNode.pendingToResubscribe;
            const hasListeners =
              oldPubSubClient.getPubSubListeners(PUBSUB_TYPE.CHANNELS).size > 0 ||
              oldPubSubClient.getPubSubListeners(PUBSUB_TYPE.PATTERNS).size > 0 ||
              (pendingOnly?.[PUBSUB_TYPE.CHANNELS]?.size ?? 0) > 0 ||
              (pendingOnly?.[PUBSUB_TYPE.PATTERNS]?.size ?? 0) > 0;

            this.pubSubNode = undefined;

            if (hasListeners) {
              await this.#initiatePubSubClient(pendingOnly, oldPubSubClient);
            }

            this.#reconnectionTracker.removeClient(oldPubSubClient._clientId);
            oldPubSubClient.destroy();
          }

          // Destroy source connections (use destroy() instead of close() since the node is being removed
          // and close() can hang if the server is not responding)
          this.#reconnectionTracker.removeClient(sourceNode.client?._clientId);
          sourceNode.client.destroy();
          if ('pubSub' in sourceNode && sourceNode.pubSub) {
            this.#reconnectionTracker.removeClient(sourceNode.pubSub.client._clientId);
            sourceNode.pubSub.client.destroy();
          }
        }
      } catch (err: unknown) {
        dbgMaintenance(`[CSlots]: Error during SMIGRATED handling for source ${sourceAddress}: ${err}`);
        // Ensure we unpause source on error to prevent deadlock
        sourceNode.client?._unpause();
        if ('pubSub' in sourceNode) {
          sourceNode.pubSub?.client._unpause();
        }
        // Unpause any destination nodes that were paused but not yet unpaused.
        // Without this they would remain frozen indefinitely, blocking all queued commands.
        for (const node of pausedDestNodes) {
          node.client?._unpause();
          node.pubSub?.client._unpause();
        }
        this.#emit('error', err)
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

  #nodeClientOptions(node: NodeAddress & { address: string }): RedisClusterClientOptions {
    return {
      socket: this.#getNodeAddress(node.address) ?? {
        host: node.host,
        port: node.port
      }
    };
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
    eagerConnect: boolean,
    addressesInUse: Set<string>
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

      if (eagerConnect) {
        this.#startNodeClientInBackground(node);
      }

      this.nodeByAddress.set(address, node);
    } else if (node.readonly !== readonly) {
      node.readonly = readonly;

      if (readonly && (node.client || node.connectPromise)) {
        const { client } = node;
        if (client) {
          this.#reconnectionTracker.removeClient(client._clientId);
          client.close().catch(() => client.destroy());
        }
        // Drop both so #startNodeClientInBackground can start a fresh connect.
        // Leaving connectPromise set would no-op the restart.
        node.client = undefined;
        node.connectPromise = undefined;

        if (eagerConnect) {
          this.#startNodeClientInBackground(node);
        }
      }
    }

    if (!addressesInUse.has(address)) {
      addressesInUse.add(address);
      (readonly ? this.replicas : this.masters).push(node);
    }

    return node;
  }

  #createClient(
    node: ShardNode<M, F, S, RESP, TYPE_MAPPING>,
    readonly = node.readonly,
    socketOverrides?: { reconnectStrategy?: false }
  ) {
    const socket =
      this.#getNodeAddress(node.address) ??
      { host: node.host, port: node.port };
    const clientInfo = Object.freeze({
      host: socket.host,
      port: socket.port,
    });
    const address = node.address;
    const emit = this.#emit;
    const client = this.#clientFactory(this.#clientOptionsDefaults({
      clientSideCache: this.clientSideCache,
      // only when the cluster has a type mapping, so the node falls back to its own
      ...(this.#options.commandOptions?.typeMapping !== undefined && {
        cacheTypeMapping: this.#options.commandOptions.typeMapping
      }),
      himportRegistry: this.#himportRegistry,
      RESP: this.#options.RESP,
      socket: {
        ...socket,
        ...socketOverrides,
      },
      readonly,
    }));
    client._setIdentity(ClientRole.CLUSTER_NODE, this.#clusterClientId);
    client
      .on('error', error => emit('node-error', error, clientInfo))
      .on('reconnecting', () => {
        emit('node-reconnecting', clientInfo);
        // Include nodes that never became ready so an unreachable master still
        // drives topologyRefreshOnReconnectionAttemptStrategy.
        this.#onNodeReconnectionAttempt(client._clientId, address);
      })
      .on('ready', () => {
        this.#reconnectionTracker.removeClient(client._clientId);
      })
      .on('ready', () => emit('node-ready', clientInfo))
      .on('connect', () => emit('node-connect', clientInfo))
      .once('end', () => {
        this.#reconnectionTracker.removeClient(client._clientId);
        emit('node-disconnect', clientInfo);
      })
      .on(SMIGRATED_EVENT, this.#handleSmigrated)
      .on('__MOVED', async (allPubSubListeners: PubSubListeners) => {
        await this.rediscover(client);
        if (!this.#isOpen) return;
        this.#emit(RESUBSCRIBE_LISTENERS_EVENT, allPubSubListeners);
      });

    return client;
  }

  #createNodeClient(node: ShardNode<M, F, S, RESP, TYPE_MAPPING>, readonly?: boolean) {
    const client = node.client = this.#createClient(node, readonly);
    const connectPromise = node.connectPromise = client.connect()
      .catch(err => {
        // Terminal connect failure (reconnectStrategy gave up). Drop the dead
        // client so the next nodeClient() call retries with a fresh one, and
        // destroy it so its ClientRegistry entry and listeners don't leak.
        // Guard on identity: #discover may have swapped in a new client while
        // this connect was in flight — never clobber that one.
        if (node.client === client) {
          node.client = undefined;
          if (node.connectPromise === connectPromise) {
            node.connectPromise = undefined;
          }
        }
        client.destroy();
        throw err;
      })
      .finally(() => {
        // Only clear if this attempt is still the current one — a demotion /
        // rediscover may have already started a newer connectPromise.
        if (node.connectPromise === connectPromise) {
          node.connectPromise = undefined;
        }
      });
    return connectPromise;
  }

  #startNodeClientInBackground(node: ShardNode<M, F, S, RESP, TYPE_MAPPING>) {
    if (node.client || node.connectPromise) return;

    this.#createNodeClient(node).catch(() => {
      // Terminal failure already destroys/clears the client in #createNodeClient.
      // Ongoing socket errors are emitted as node-error.
    });
  }

  #connectTimeoutMs() {
    const timeout = this.#options.defaults?.socket?.connectTimeout;
    // 0 disables the socket timer — do not treat it as a 0ms cluster deadline.
    if (typeof timeout === 'number' && timeout > 0) {
      return timeout;
    }
    return 5000;
  }

  #awaitConnectWithTimeout(
    connectPromise: Promise<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>
  ) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return Promise.race([
      connectPromise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new TimeoutError()),
          this.#connectTimeoutMs()
        );
      })
    ]).finally(() => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    });
  }

  #discardNode(node: ShardNode<M, F, S, RESP, TYPE_MAPPING>) {
    this.masters = this.masters.filter(master => master !== node);
    this.replicas = this.replicas.filter(replica => replica !== node);
    if (this.nodeByAddress.get(node.address) === node) {
      this.nodeByAddress.delete(node.address);
    }
    node.connectPromise = undefined;
    this.#retiredNodes.add(node);

    if (node.client) {
      this.#reconnectionTracker.removeClient(node.client._clientId);
      node.client.destroy();
      node.client = undefined;
    }

    const master = node as MasterNode<M, F, S, RESP, TYPE_MAPPING>;
    if (master.pubSub) {
      this.#reconnectionTracker.removeClient(master.pubSub.client._clientId);
      master.pubSub.client.destroy();
      master.pubSub = undefined;
    }
  }

  nodeClient(node: ShardNode<M, F, S, RESP, TYPE_MAPPING>): Promise<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> {
    if (this.#retiredNodes.has(node)) {
      return Promise.reject(new ClientClosedError());
    }

    if (!node.client) this.#startNodeClientInBackground(node);

    // With disableOfflineQueue, commands cannot wait in the offline queue while
    // the socket is connecting — wait for connect() instead.
    // Also wait when the client was cleared mid-connect so we never resolve
    // `undefined` into fan-out remapping.
    if (
      node.connectPromise &&
      (
        !node.client ||
        this.#options.defaults?.disableOfflineQueue === true
      )
    ) {
      // Bound the wait: with a retrying reconnectStrategy an unreachable node
      // never rejects connectPromise, which would hang getClientForKey forever.
      if (this.#options.defaults?.disableOfflineQueue === true) {
        return this.#awaitConnectWithTimeout(node.connectPromise);
      }
      return node.connectPromise;
    }

    if (!node.client) {
      return Promise.reject(new ClientClosedError());
    }

    // Return the client while connect() is still in flight so commands enter
    // the offline queue and honor commandOptions.timeout.
    return Promise.resolve(node.client);
  }

  #runningRediscoverPromise?: Promise<void>;

  async rediscover(startWith?: RedisClientType<M, F, S, RESP>, excludedAddresses?: ReadonlySet<string>): Promise<void> {
    this.#runningRediscoverPromise ??= this.#rediscover(startWith, excludedAddresses)
      .finally(() => {
        this.#runningRediscoverPromise = undefined
      });
    return this.#runningRediscoverPromise;
  }

  async #rediscover(startWith?: RedisClientType<M, F, S, RESP>, excludedAddresses?: ReadonlySet<string>): Promise<void> {
    if (startWith && await this.#discover(startWith.options!)) return;

    if (await this.#discoverWithKnownNodes(excludedAddresses)) return;

    return this.#discoverWithRootNodes();
  }

  async #discoverWithKnownNodes(excludedAddresses?: ReadonlySet<string>) {
    const candidates: Array<ShardNode<M, F, S, RESP, TYPE_MAPPING>> = [];
    const deferredCandidates: Array<ShardNode<M, F, S, RESP, TYPE_MAPPING>> = [];
    const seen = new Set<string>();

    for (const nodes of [this.masters, this.replicas]) {
      for (const node of nodes) {
        if (excludedAddresses?.has(node.address) || seen.has(node.address)) continue;

        seen.add(node.address);

        if (node.client?.isReady) {
          candidates.push(node);
        } else {
          deferredCandidates.push(node);
        }
      }
    }

    return (
      await this.#discoverWithKnownNodeCandidates(candidates) ||
      await this.#discoverWithKnownNodeCandidates(deferredCandidates)
    );
  }

  async #discoverWithKnownNodeCandidates(candidates: Array<ShardNode<M, F, S, RESP, TYPE_MAPPING>>) {
    if (!candidates.length) {
      return false;
    }

    const start = Math.floor(Math.random() * candidates.length);
    for (let i = 0; i < candidates.length; i++) {

      if (!this.#isOpen) {
        continue;
      }

      const candidate = candidates[(start + i) % candidates.length];
      if (await this.#discover(this.#nodeClientOptions(candidate))) {
        return true;
      }
    }

    return false;
  }

  #onNodeReconnectionAttempt(clientId: string, address: string) {
    let shouldRefresh: boolean;
    try {
      shouldRefresh = this.#reconnectionTracker.onReconnectionAttempt(clientId, address);
    } catch (err) {
      this.#emit('error', err);
      return;
    }

    if (shouldRefresh) {
      this.#scheduleTopologyRefresh(this.#reconnectionTracker.reconnectingAddresses);
    }
  }

  #scheduleTopologyRefresh(excludedAddresses: ReadonlySet<string>) {
    if (!this.#isOpen || this.#topologyRefreshPromise) return;

    this.#topologyRefreshPromise = this.rediscover(undefined, new Set(excludedAddresses))
      // a refresh cut short by destroy() rejects with 'Cluster closed' — nobody
      // may be listening for 'error' any more
      .catch(err => {
        if (this.#isOpen) this.#emit('error', err);
      })
      .finally(() => {
        this.#topologyRefreshPromise = undefined;
      });
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

  /**
   * @internal
   * Detach and return every pub/sub listener across the cluster: channels and
   * patterns live on the dedicated pub/sub node, sharded listeners on each
   * shard's pub/sub connection. Used by the multi-database client to hand
   * subscriptions to another cluster on failover — removal (not a copy) stops a
   * recovering old cluster re-delivering to the same listeners.
   */
  removeAllPubSubListeners(): PubSubListeners {
    const merged: PubSubListeners = {
      [PUBSUB_TYPE.CHANNELS]: new Map(),
      [PUBSUB_TYPE.PATTERNS]: new Map(),
      [PUBSUB_TYPE.SHARDED]: new Map()
    };

    const drain = (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>) => {
      const listeners = client._getQueue().removeAllPubSubListeners();
      for (const type of [PUBSUB_TYPE.CHANNELS, PUBSUB_TYPE.PATTERNS, PUBSUB_TYPE.SHARDED] as const) {
        for (const [channel, channelListeners] of listeners[type]) {
          merged[type].set(channel, channelListeners);
        }
      }
    };

    if (this.pubSubNode) {
      // Capture listeners still waiting on connect before draining the client.
      const pending = this.pubSubNode.pendingToResubscribe;
      const dying = this.pubSubNode;
      drain(dying.client);
      if (pending) {
        merged[PUBSUB_TYPE.CHANNELS] = mergePubSubTypeListeners(
          merged[PUBSUB_TYPE.CHANNELS],
          pending[PUBSUB_TYPE.CHANNELS]
        );
        merged[PUBSUB_TYPE.PATTERNS] = mergePubSubTypeListeners(
          merged[PUBSUB_TYPE.PATTERNS],
          pending[PUBSUB_TYPE.PATTERNS]
        );
      }
      // Clear before destroy so the dedicated pub/sub `end` handler no-ops.
      this.pubSubNode = undefined;
      // server-side subscriber state is per-connection: destroy the drained
      // connection or the server keeps pushing every publish to a client with
      // zero listeners; a later subscribe recreates the node lazily
      this.#reconnectionTracker.removeClient(dying.client._clientId);
      dying.client.destroy();
    }
    for (const master of this.masters) {
      if (master.pubSub) {
        drain(master.pubSub.client);
        this.#reconnectionTracker.removeClient(master.pubSub.client._clientId);
        master.pubSub.client.destroy();
        master.pubSub = undefined;
      }
    }

    return merged;
  }

  /**
   * @internal
   * Adopt listeners handed over from another cluster (the multi-database
   * client moves subscriptions with the traffic on failover). Seeds the
   * target pub/sub clients' listener maps SYNCHRONOUSLY — those maps are what
   * {@link removeAllPubSubListeners} extracts, so a second failover arriving
   * mid-adoption still finds every listener; the wire subscribes ride each
   * client's own connect/handshake replay. Resolves once the wire confirms.
   */
  extendAllPubSubListeners(allListeners: PubSubListeners): Promise<unknown> {
    const promises: Array<Promise<unknown>> = [];

    const channels = allListeners[PUBSUB_TYPE.CHANNELS];
    const patterns = allListeners[PUBSUB_TYPE.PATTERNS];
    if (channels.size || patterns.size) {
      if (!this.pubSubNode) {
        if (this.masters.length === 0) {
          promises.push(Promise.reject(new Error('cannot adopt pub/sub listeners: no known cluster nodes')));
        } else {
          // Pass listeners as toResubscribe so a failed first pick still carries
          // them when #initiatePubSubClient retries on another shard. Assigns
          // pubSubNode (+ pendingToResubscribe) synchronously for mid-adoption
          // removeAllPubSubListeners visibility.
          promises.push(this.#initiatePubSubClient({
            [PUBSUB_TYPE.CHANNELS]: channels,
            [PUBSUB_TYPE.PATTERNS]: patterns
          }));
        }
      } else {
        promises.push(
          this.pubSubNode.client.extendPubSubListeners(PUBSUB_TYPE.CHANNELS, channels),
          this.pubSubNode.client.extendPubSubListeners(PUBSUB_TYPE.PATTERNS, patterns)
        );
      }
    }

    for (const [channel, listeners] of allListeners[PUBSUB_TYPE.SHARDED]) {
      const master = this.slots[calculateSlot(channel)]?.master;
      if (!master) {
        promises.push(Promise.reject(
          new Error(`cannot adopt sharded pub/sub listeners for "${channel}": unknown slot owner`)
        ));
        continue;
      }
      if (!master.pubSub) {
        // sync side-effect: assigns master.pubSub with a connecting client
        promises.push(this.#initiateShardedPubSubClient(master));
      }
      promises.push(
        master.pubSub!.client.extendPubSubChannelListeners(PUBSUB_TYPE.SHARDED, channel, listeners)
      );
    }

    // Promise.all attaches a handler to every promise — a failed connect or
    // subscribe surfaces to the caller instead of as an unhandled rejection
    return Promise.all(promises);
  }

  destroy() {
    this.#isOpen = false;
    this.#isReady = false;
    this.#pubSubInitiatePromise = undefined;

    for (const client of this.#clients()) {
      client.destroy();
    }

    if (this.pubSubNode) {
      const dying = this.pubSubNode;
      this.pubSubNode = undefined;
      dying.client.destroy();
    }

    this.#resetSlots();
    this.nodeByAddress.clear();
    this.#reconnectionTracker.clear();
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
    this.#isReady = false;
    this.#pubSubInitiatePromise = undefined;

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
    this.#reconnectionTracker.clear();

    await Promise.allSettled(promises);
    this.#emit('disconnect');
  }

  #assertReady() {
    if (!this.#isOpen) {
      throw new ClientClosedError();
    }

    if (!this.#isReady) {
      throw new ClientOfflineError();
    }
  }

  /**
   * All fan-out target nodes (masters + replicas), WITHOUT connecting. The
   * caller connects each node lazily in its own per-node promise so a single
   * failed connect rejects only that node's execution — letting reducers such
   * as `one_succeeded` still see the reachable shards — instead of a `Promise.all`
   * over the connects failing the whole route up front. Excludes the dedicated
   * PubSub connection (not in `masters`/`replicas`).
   */
  getAllNodes() {
    this.#assertReady();

    return [...this.masters, ...this.replicas];
  }

  /** Master fan-out target nodes, WITHOUT connecting (see {@link getAllNodes}). */
  getAllMasterNodes() {
    this.#assertReady();

    return this.masters;
  }

  async getClientAndSlotNumber(
    firstKey: RedisArgument | undefined,
    isReadonly: boolean | undefined
  ): Promise<{
    client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
    slotNumber?: number
  }> {
    this.#assertReady();

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

  getClientForKey(
    key: RedisArgument,
    isReadonly: boolean | undefined
  ): Promise<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> {
    this.#assertReady();

    const slotNumber = calculateSlot(key);
    if (isReadonly) {
      return this.nodeClient(this.getSlotRandomNode(slotNumber));
    }

    return this.nodeClient(this.slots[slotNumber].master);
  }

  *#iterateAllNodes() {
    if (this.masters.length + this.replicas.length === 0) return
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

  /**
   * Prefer proven-ready nodes; when none are ready yet, prefer addresses that
   * are not already in the reconnection tracker so keyless routing avoids a
   * shard that already failed its first connect while another is still hopeful.
   */
  #preferredRoutingPool(
    nodes: ReadonlyArray<ShardNode<M, F, S, RESP, TYPE_MAPPING>>
  ): Array<ShardNode<M, F, S, RESP, TYPE_MAPPING>> {
    const eligible = nodes.filter(node => !this.#retiredNodes.has(node));
    const ready = eligible.filter(node => node.client?.isReady);
    if (ready.length > 0) return ready;

    const reconnecting = this.#reconnectionTracker.reconnectingAddresses;
    const hopeful = eligible.filter(node => !reconnecting.has(node.address));
    return hopeful.length > 0 ? hopeful : eligible;
  }

  getRandomNode() {
    this.#assertReady();

    this._randomNodeIterator ??= this.#iterateAllNodes();

    const pool = this.#preferredRoutingPool([...this.masters, ...this.replicas]);
    const poolSet = new Set(pool);
    const maxAttempts = Math.max(1, pool.length) * 2;
    for (let i = 0; i < maxAttempts; i++) {
      const node = this._randomNodeIterator.next().value as ShardNode<M, F, S, RESP, TYPE_MAPPING>;
      if (poolSet.has(node)) {
        return node;
      }
    }

    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }

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

    const shard = slot as ShardWithReplicas<M, F, S, RESP, TYPE_MAPPING>;
    slot.nodesIterator ??= this.#slotNodesIterator(shard);

    const pool = this.#preferredRoutingPool([shard.master, ...shard.replicas]);
    const poolSet = new Set(pool);
    const maxAttempts = (1 + shard.replicas.length) * 2;
    for (let i = 0; i < maxAttempts; i++) {
      const node = slot.nodesIterator.next().value as ShardNode<M, F, S, RESP, TYPE_MAPPING>;
      if (poolSet.has(node)) {
        return node;
      }
    }

    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }

    return slot.nodesIterator.next().value as ShardNode<M, F, S, RESP, TYPE_MAPPING>;
  }

  getMasterByAddress(address: string) {
    const master = this.nodeByAddress.get(address);
    if (!master) return;

    return this.nodeClient(master);
  }

  /**
   * Reverse-resolve a routed client to its node address. FT.AGGREGATE is
   * keyless, so the plan carries only the client; we need its address to bind
   * the cursor. Clients are few per cluster, so the linear scan is negligible.
   */
  nodeAddressByClient(client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>): string | undefined {
    for (const [address, node] of this.nodeByAddress) {
      if (node.client === client) return address;
    }
    return undefined;
  }

  /**
   * Drop bindings idle past their MAXIDLE (or the default TTL). Opportunistic —
   * runs on each `bindCursor` so there's no timer to manage (see
   * `smigratedSeqIdsSeen`). Cheap: the map holds only live cursors.
   */
  #sweepStaleCursors(now: number) {
    for (const [key, binding] of this.cursorBindings) {
      const ttl = binding.maxIdleMs ?? DEFAULT_CURSOR_MAX_IDLE_MS;
      if (now - binding.createdAt > ttl) {
        this.cursorBindings.delete(key);
      }
    }
  }

  bindCursor(token: string, binding: Omit<CursorBinding, 'createdAt'>) {
    const now = Date.now();
    this.#sweepStaleCursors(now);
    this.cursorBindings.set(token, { ...binding, createdAt: now });
  }

  lookupCursor(token: string): CursorBinding | undefined {
    return this.cursorBindings.get(token);
  }

  evictCursor(token: string) {
    this.cursorBindings.delete(token);
  }

  /**
   * Mint a fresh virtual cursor token (cluster-wide SCAN chains, sticky FT
   * cursors). Tokens are what the client hands back to the caller in place of
   * the per-node server cursor: opaque, non-"0", never colliding with each
   * other. A plain counter keeps them valid-looking cursor values for callers
   * that treat the cursor as an opaque number.
   */
  mintCursorToken(): string {
    return String(++this.#cursorTokenSeq);
  }

  /**
   * Same opportunistic, timer-free sweep as `#sweepStaleCursors`: an abandoned
   * scan (caller stopped iterating mid-way) would otherwise leak its entry.
   */
  #sweepStaleScanCursors(now: number) {
    for (const [token, entry] of this.scanCursors) {
      if (now - entry.createdAt > DEFAULT_CURSOR_MAX_IDLE_MS) {
        this.scanCursors.delete(token);
      }
    }
  }

  bindScanCursor(token: string, address: string, cursor: string, visited: Set<string>, label: string) {
    const now = Date.now();
    this.#sweepStaleScanCursors(now);
    this.scanCursors.set(token, { address, cursor, visited, createdAt: now, label });
  }

  lookupScanCursor(token: string): ScanCursorEntry | undefined {
    return this.scanCursors.get(token);
  }

  evictScanCursor(token: string) {
    this.scanCursors.delete(token);
  }

  /**
   * First master (in current topology order) whose address is not in
   * `visited` — the next node a cluster-wide SCAN chain should walk.
   */
  nextScanTarget(visited: ReadonlySet<string>): string | undefined {
    return this.masters.find(master => !visited.has(master.address))?.address;
  }

  getPubSubClient(): Promise<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> {
    this.#assertReady();

    // Join an in-flight retry loop so concurrent callers do not reject on the
    // first failed shard pick while initiate is still falling back.
    if (this.#pubSubInitiatePromise) return this.#pubSubInitiatePromise;

    if (!this.pubSubNode) return this.#initiatePubSubClient();

    // Dedicated pub/sub uses reconnectStrategy: false (fail-fast on pick). A
    // later drop terminates the client; recreate with carried listeners.
    if (!this.pubSubNode.client.isOpen && !this.pubSubNode.connectPromise) {
      return this.#recreatePubSubClient();
    }

    return this.pubSubNode.connectPromise ?? Promise.resolve(this.pubSubNode.client);
  }

  #recreatePubSubClient(): Promise<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> {
    const dying = this.pubSubNode;
    if (!dying) return this.#initiatePubSubClient();

    const toResubscribe = pubSubNodeListenersToCarry(dying);
    this.pubSubNode = undefined;
    this.#reconnectionTracker.removeClient(dying.client._clientId);
    dying.client.destroy();

    if (
      toResubscribe[PUBSUB_TYPE.CHANNELS].size ||
      toResubscribe[PUBSUB_TYPE.PATTERNS].size
    ) {
      return this.#initiatePubSubClient(toResubscribe);
    }

    return this.#initiatePubSubClient();
  }

  #pickPubSubTarget(exclude: ReadonlySet<string>) {
    const candidates = [...this.masters, ...this.replicas]
      .filter(node => !this.#retiredNodes.has(node) && !exclude.has(node.address));
    if (candidates.length === 0) return undefined;

    const pool = this.#preferredRoutingPool(candidates);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  #initiatePubSubClient(
    toResubscribe?: PubSubToResubscribe,
    previousClient?: RedisClientType<M, F, S, RESP, TYPE_MAPPING>
  ) {
    if (this.#pubSubInitiatePromise) {
      const joining = this.#pubSubInitiatePromise;
      return joining.then(async client => {
        if (!toResubscribe && !previousClient) return client;

        const channels = mergePubSubTypeListeners(
          previousClient?.getPubSubListeners(PUBSUB_TYPE.CHANNELS),
          toResubscribe?.[PUBSUB_TYPE.CHANNELS]
        );
        const patterns = mergePubSubTypeListeners(
          previousClient?.getPubSubListeners(PUBSUB_TYPE.PATTERNS),
          toResubscribe?.[PUBSUB_TYPE.PATTERNS]
        );
        if (!channels.size && !patterns.size) return client;

        // Stash on the current node so a rediscover mid-join still carries them.
        if (this.pubSubNode) {
          this.pubSubNode.pendingToResubscribe = {
            [PUBSUB_TYPE.CHANNELS]: mergePubSubTypeListeners(
              this.pubSubNode.pendingToResubscribe?.[PUBSUB_TYPE.CHANNELS],
              channels
            ),
            [PUBSUB_TYPE.PATTERNS]: mergePubSubTypeListeners(
              this.pubSubNode.pendingToResubscribe?.[PUBSUB_TYPE.PATTERNS],
              patterns
            )
          };
        }

        const handoff = {
          [PUBSUB_TYPE.CHANNELS]: channels,
          [PUBSUB_TYPE.PATTERNS]: patterns
        };

        const restartIfSuperseded = () => {
          if (!this.#isOpen) throw new ClientClosedError();
          if (this.pubSubNode?.client === client) return null;
          // Drop the settled join handle so we start a fresh initiate instead of
          // re-entering the same promise.
          if (this.#pubSubInitiatePromise === joining) {
            this.#pubSubInitiatePromise = undefined;
          }
          return this.#initiatePubSubClient(handoff);
        };

        // Shared initiate may have been destroyed/replaced before this .then.
        const before = restartIfSuperseded();
        if (before) return before;

        await Promise.all([
          client.extendPubSubListeners(PUBSUB_TYPE.CHANNELS, channels),
          client.extendPubSubListeners(PUBSUB_TYPE.PATTERNS, patterns)
        ]);

        const after = restartIfSuperseded();
        if (after) return after;

        // Applied to live maps — clear pending so a later rediscover cannot
        // revive channels unsubscribed after this handoff.
        if (this.pubSubNode?.client === client) {
          this.pubSubNode.pendingToResubscribe = undefined;
        }

        return client;
      });
    }

    const promise = this.#runPubSubInitiate(toResubscribe, previousClient)
      .finally(() => {
        if (this.#pubSubInitiatePromise === promise) {
          this.#pubSubInitiatePromise = undefined;
        }
      });
    this.#pubSubInitiatePromise = promise;
    return promise;
  }

  async #runPubSubInitiate(
    toResubscribe?: PubSubToResubscribe,
    previousClient?: RedisClientType<M, F, S, RESP, TYPE_MAPPING>
  ) {
    const tried = new Set<string>();
    let lastError: unknown;

    while (this.#isOpen) {
      const node = this.#pickPubSubTarget(tried);
      if (!node) {
        throw lastError ?? new ClientClosedError();
      }
      tried.add(node.address);

      try {
        return await this.#connectPubSubClientOn(node, toResubscribe, previousClient);
      } catch (err) {
        lastError = err;
        if (!this.#isOpen) {
          throw err instanceof ClientClosedError ? err : new ClientClosedError();
        }
        // Own attempt clears pubSubNode on failure. A remaining pubSubNode means
        // another initiate/rediscover won — join it for any error class, not only
        // ClientClosedError (socket errors while superseded must not steal it).
        if (this.pubSubNode) {
          return this.pubSubNode.connectPromise ?? this.pubSubNode.client;
        }
        // Try another shard — an unreachable pick must not block pub/sub forever.
      }
    }

    throw lastError ?? new ClientClosedError();
  }

  #connectPubSubClientOn(
    node: ShardNode<M, F, S, RESP, TYPE_MAPPING>,
    toResubscribe?: PubSubToResubscribe,
    previousClient?: RedisClientType<M, F, S, RESP, TYPE_MAPPING>
  ) {
    // Fail this attempt quickly so we can fall back to another shard instead of
    // retrying forever under the default reconnectStrategy.
    const client = this.#createClient(node, false, { reconnectStrategy: false });

    // When replacing an still-open previous client (SMIGRATED), seed pending with
    // a live+pending merge so a mid-connect rediscover does not drop listeners.
    // Apply-time re-reads previousClient so concurrent UNSUBSCRIBE wins.
    const pendingToResubscribe = previousClient
      ? {
          [PUBSUB_TYPE.CHANNELS]: mergePubSubTypeListeners(
            previousClient.getPubSubListeners(PUBSUB_TYPE.CHANNELS),
            toResubscribe?.[PUBSUB_TYPE.CHANNELS]
          ),
          [PUBSUB_TYPE.PATTERNS]: mergePubSubTypeListeners(
            previousClient.getPubSubListeners(PUBSUB_TYPE.PATTERNS),
            toResubscribe?.[PUBSUB_TYPE.PATTERNS]
          )
        }
      : toResubscribe;

    const pubSubNode: PubSubNode<M, F, S, RESP, TYPE_MAPPING> = {
      address: node.address,
      client,
      pendingToResubscribe
    };

    this.pubSubNode = pubSubNode;

    pubSubNode.connectPromise = client.connect()
      .then(async client => {
        if (this.pubSubNode !== pubSubNode) {
          client.destroy();
          throw new ClientClosedError();
        }

        // Attach before resubscribe so a drop during extendPubSubListeners is
        // observed (reconnectStrategy is false — no automatic reconnect).
        client.once('end', () => {
          if (!this.#isOpen || this.pubSubNode !== pubSubNode) return;
          this.#recreatePubSubClient().catch(err => {
            if (err instanceof ClientClosedError && this.#isOpen) return;
            if (this.#isOpen) this.#emit('error', err);
          });
        });

        if (toResubscribe || previousClient) {
          // Re-read previousClient so an UNSUBSCRIBE that completed while we
          // waited to connect is not silently resurrected from the snapshot.
          const channels = mergePubSubTypeListeners(
            previousClient?.getPubSubListeners(PUBSUB_TYPE.CHANNELS),
            toResubscribe?.[PUBSUB_TYPE.CHANNELS]
          );
          const patterns = mergePubSubTypeListeners(
            previousClient?.getPubSubListeners(PUBSUB_TYPE.PATTERNS),
            toResubscribe?.[PUBSUB_TYPE.PATTERNS]
          );

          if (channels.size || patterns.size) {
            await Promise.all([
              client.extendPubSubListeners(PUBSUB_TYPE.CHANNELS, channels),
              client.extendPubSubListeners(PUBSUB_TYPE.PATTERNS, patterns)
            ]);
          }

          if (this.pubSubNode !== pubSubNode) {
            client.destroy();
            throw new ClientClosedError();
          }

          pubSubNode.pendingToResubscribe = undefined;
        }

        pubSubNode.connectPromise = undefined;
        return client;
      })
      .catch(err => {
        // Clear before destroy so an `end` handler (if already attached) no-ops.
        if (this.pubSubNode === pubSubNode) {
          this.pubSubNode = undefined;
        }
        this.#reconnectionTracker.removeClient(client._clientId);
        client.destroy();
        throw err;
      });

    return pubSubNode.connectPromise!;
  }

  async executeUnsubscribeCommand(
    unsubscribe: (client: RedisClientType<M, F, S, RESP>) => Promise<void>
  ): Promise<void> {
    const client = await this.getPubSubClient();
    await unsubscribe(client);

    if (!client.isPubSubActive) {
      this.#reconnectionTracker.removeClient(client._clientId);
      // Clear before destroy so the dedicated pub/sub `end` handler no-ops.
      this.pubSubNode = undefined;
      client.destroy();
    }
  }

  getShardedPubSubClient(channel: string): Promise<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> {
    this.#assertReady();

    const { master } = this.slots[calculateSlot(channel)];
    if (!master.pubSub) return this.#initiateShardedPubSubClient(master);
    return master.pubSub.connectPromise ?? Promise.resolve(master.pubSub.client);
  }

  async #initiateShardedPubSubClient(master: MasterNode<M, F, S, RESP, TYPE_MAPPING>) {
    const client = this.#createClient(master, false);

    client.on('sharded-channel-moved', async (channel, listeners) => {
      const maxCommandRedirections = this.#options.maxCommandRedirections ?? 16;
      try {
        let refreshFrom = client;
        for (let redirections = 0; ; redirections++) {
          await this.rediscover(refreshFrom);
          const redirectTo = await this.getShardedPubSubClient(channel);
          try {
            await redirectTo.extendPubSubChannelListeners(
              PUBSUB_TYPE.SHARDED,
              channel,
              listeners
            );
            return;
          } catch (err) {
            // a refresh that was already running when the slot moved can
            // return the old owner, which answers MOVED
            if (!(err instanceof ErrorReply) || !err.message.startsWith('MOVED')) throw err;
            if (redirections >= maxCommandRedirections) throw new MaxCommandRedirectionsError(err);
            refreshFrom = redirectTo;
          }
        }
      } catch (err) {
        this.#emit('sharded-channel-moved-error', err, channel, listeners);
      }
    });


    const pubSub: NonNullable<MasterNode<M, F, S, RESP, TYPE_MAPPING>['pubSub']> = { client };
    master.pubSub = pubSub;

    // a pub/sub move can destroy this client mid-connect and seat a
    // replacement before the rejection lands: clear the slot only if it is
    // still ours, or the stale rejection orphans the replacement
    pubSub.connectPromise = client.connect()
      .then(client => {
        pubSub.connectPromise = undefined;
        return client;
      })
      .catch(err => {
        if (master.pubSub === pubSub) {
          master.pubSub = undefined;
        }
        throw err;
      });

    return pubSub.connectPromise;
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
      this.#reconnectionTracker.removeClient(client._clientId);
      client.destroy();
      master.pubSub = undefined;
    }
  }
}
