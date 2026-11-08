import { strict as assert } from 'node:assert';
import { EventEmitter, once } from 'node:events';
import * as net from 'node:net';
import { createServer, type AddressInfo, type Socket } from 'node:net';
import { RedisClusterClientOptions } from './index';
import RedisClusterSlots, {
  groupCommandsByDestination,
  splitInFlightChainTail,
  RESUBSCRIBE_LISTENERS_EVENT,
} from './cluster-slots';
import type { MasterNode, Shard, ShardNode } from './cluster-slots';
import type { CommandToWrite } from '../client/commands-queue';
import { ClientClosedError, ClusterNodeUnreachableError } from '../errors';

import { SMIGRATED_EVENT, type SMigratedEvent } from '../client/enterprise-maintenance-manager';

async function withDeadline<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

describe('RedisClusterSlots', () => {
  function createCommand(slotNumber?: number) {
    return {
      args: ['CMD'],
      slotNumber
    } as CommandToWrite;
  }

  function createMaster(address: string) {
    return {
      address
    } as MasterNode<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      3,
      Record<string, never>
    >;
  }

  describe('initialization', () => {
    describe('clientSideCache validation', () => {
      const mockEmit: EventEmitter['emit'] = () => true;
      const clientSideCacheConfig = { ttl: 0, maxEntries: 0 };
      const rootNodes: Array<RedisClusterClientOptions> = [
        { socket: { host: 'localhost', port: 30001 } }
      ];

      it('should throw error when clientSideCache is enabled with RESP 2', () => {
        assert.throws(
          () => new RedisClusterSlots({
            rootNodes,
            clientSideCache: clientSideCacheConfig,
            RESP: 2 as const,
          }, mockEmit),
          new Error('Client Side Caching is only supported with RESP3')
        );
      });

      it('should not throw when clientSideCache is enabled with RESP undefined', () => {
        assert.doesNotThrow(() =>
          new RedisClusterSlots({
            rootNodes,
            clientSideCache: clientSideCacheConfig,
          }, mockEmit)
        );
      });

      it('should not throw when clientSideCache is enabled with RESP 3', () => {
        assert.doesNotThrow(() =>
          new RedisClusterSlots({
            rootNodes,
            clientSideCache: clientSideCacheConfig,
            RESP: 3 as const,
          }, mockEmit)
        );
      });
    });
  });

  describe('getRandomNode', ()=> {
    // getRandomNode backs the keyless/fan-out routes, so on a cluster that is
    // not open it must throw the standard ClientClosedError like every other
    // command path rather than returning undefined or spinning the node
    // iterator. The zero-node iterator guard still protects the ready case.
    it('throws ClientClosedError when the cluster is not connected', () => {
        const slots = new RedisClusterSlots({
          rootNodes: []
        }, () => true)
        assert.throws(() => slots.getRandomNode(), ClientClosedError)
      });
  });

  describe('groupCommandsByDestination', () => {
    it('groups commands by their slot owner instead of the fallback destination', () => {
      const fallback = createMaster('fallback:6379');
      const slotOwner = createMaster('slot-owner:6379');
      const otherSlotOwner = createMaster('other-slot-owner:6379');
      const slots = [] as Array<Shard<
        Record<string, never>,
        Record<string, never>,
        Record<string, never>,
        3,
        Record<string, never>
      >>;
      slots[1] = { master: slotOwner };
      slots[2] = { master: otherSlotOwner };

      const slotless = createCommand();
      const slotOne = createCommand(1);
      const slotTwo = createCommand(2);

      const { byDestination, unrouted } = groupCommandsByDestination(
        [slotless, slotOne, slotTwo],
        slots,
        fallback
      );

      assert.deepEqual(byDestination.get(fallback), [slotless]);
      assert.deepEqual(byDestination.get(slotOwner), [slotOne]);
      assert.deepEqual(byDestination.get(otherSlotOwner), [slotTwo]);
      assert.deepEqual(unrouted, []);
    });

    it('falls back when a command has no known slot owner', () => {
      const fallback = createMaster('fallback:6379');
      const command = createCommand(10);

      const { byDestination, unrouted } = groupCommandsByDestination([command], [], fallback);

      assert.deepEqual(byDestination.get(fallback), [command]);
      assert.deepEqual(unrouted, []);
    });

    it('reports commands as unrouted instead of dropping them when there is no fallback either', () => {
      const slotless = createCommand();
      const unknownSlot = createCommand(10);

      const { byDestination, unrouted } = groupCommandsByDestination(
        [slotless, unknownSlot],
        [],
        undefined
      );

      assert.strictEqual(byDestination.size, 0);
      assert.deepEqual(unrouted, [slotless, unknownSlot]);
    });
  });

  describe('splitInFlightChainTail', () => {
    function createChainCommand(chainId: symbol, slotNumber?: number) {
      return { args: ['CMD'], slotNumber, chainId } as CommandToWrite;
    }

    // Mirrors the full-node-loss path in cluster-slots.ts: extractAllCommands()
    // pulls everything out of a dying node's queue regardless of slot, then
    // this function has to tell apart the in-flight chain's own queued tail
    // (whose head is already sent, out of view in #waitingForReply - can't be
    // safely relocated) from an unrelated, fully-queued chain that happens to
    // be sitting right behind it and is safe to relocate whole.
    it('separates only the in-flight chain\'s tail and leaves an unrelated, fully-queued chain relocatable', () => {
      const chainA = Symbol('Chain A (in-flight)');
      const chainB = Symbol('Chain B (fully queued, never sent)');

      const chainATail = [createChainCommand(chainA, 5), createChainCommand(chainA, 5)];
      const chainBCommands = [
        createChainCommand(chainB, 1),
        createChainCommand(chainB, 1),
        createChainCommand(chainB, 1),
      ];

      const { inFlightChainTail, relocatable } = splitInFlightChainTail(
        [...chainATail, ...chainBCommands],
        chainA,
      );

      // The in-flight chain's tail is set apart, not relocatable - the
      // caller rejects it...
      assert.deepEqual(inFlightChainTail, chainATail);
      // ...and chain B, despite queuing right behind it, isn't mistaken for
      // part of it - it comes back whole, ready to relocate atomically.
      assert.deepEqual(relocatable, chainBCommands);
    });

    it('treats every command as relocatable when nothing is in flight', () => {
      const chainB = Symbol('Chain B');
      const commands = [createChainCommand(chainB, 1), createChainCommand(chainB, 1)];

      const { inFlightChainTail, relocatable } = splitInFlightChainTail(commands, undefined);

      assert.deepEqual(inFlightChainTail, []);
      assert.deepEqual(relocatable, commands);
    });
  });

  describe('nodeClient after a terminal connect failure (#3396)', () => {
    // Point a node at a dead address with reconnectStrategy disabled so the
    // very first connect fails terminally (no retries).
    function createSlots() {
      return new RedisClusterSlots({
        rootNodes: [{ socket: { host: '127.0.0.1', port: 1 } }],
        defaults: { socket: { host: '127.0.0.1', port: 1, reconnectStrategy: false, connectTimeout: 100 } },
      }, () => true, 'test-cluster');
    }

    function createNode() {
      return {
        address: '127.0.0.1:1',
        host: '127.0.0.1',
        port: 1,
        id: 'test-node',
        readonly: false,
      } as ShardNode<Record<string, never>, Record<string, never>, Record<string, never>, 3, Record<string, never>>;
    }

    it('does not cache the dead client and retries on the next call', async () => {
      const slots = createSlots();
      const node = createNode();

      // First attempt fails terminally, and must reject with the real connect
      // error — not a ClientClosedError thrown by destroy() on the dead client
      // (which would prove destroy() is not idempotent on a closed socket).
      await assert.rejects(slots.nodeClient(node), (err: unknown) => {
        assert(!(err instanceof ClientClosedError), 'should surface the real connect error, not ClientClosedError from destroy()');
        return true;
      });
      // The dead client must not stay cached...
      assert.equal(node.client, undefined, 'dead client should be cleared, not cached');

      // ...so the second call retries with a fresh client and fails again.
      // Before the fix it resolved to the cached dead client (no rejection).
      await assert.rejects(slots.nodeClient(node), 'second call must retry, not return the cached dead client');
      assert.equal(node.client, undefined);
    });
  });

  describe('destroy() during discovery', () => {
    // A minimal RESP2 server: +OK to every command and a one-shard CLUSTER
    // SLOTS reply pointing at itself. With `hold` set the slots reply waits
    // for release(), so it can land after destroy(); with `rejecting` set new
    // connections are dropped at once.
    async function startFakeNode() {
      const sockets = new Set<Socket>();
      let releaseSlots!: () => void;
      const state = { hold: false, rejecting: false };
      const server = createServer(socket => {
        if (state.rejecting) {
          socket.destroy();
          return;
        }
        sockets.add(socket);
        socket.on('close', () => sockets.delete(socket));
        socket.on('data', chunk => {
          // one reply per command; commands are RESP arrays starting with '*'
          for (const command of chunk.toString().split('*').filter(part => /^\d+\r\n\$/.test(part))) {
            if (/CLUSTER\r\n\$5\r\nSLOTS/i.test(command)) {
              const { port } = server.address() as AddressInfo;
              const reply = () => socket.write(`*1\r\n*3\r\n:0\r\n:16383\r\n*3\r\n$9\r\n127.0.0.1\r\n:${port}\r\n$2\r\nid\r\n`);
              if (state.hold) {
                releaseSlots = reply;
                server.emit('slots-requested');
              } else {
                reply();
              }
            } else {
              socket.write('+OK\r\n');
            }
          }
        });
      });
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      return {
        port: (server.address() as AddressInfo).port,
        state,
        nextSlotsRequest: () => once(server, 'slots-requested'),
        release: () => releaseSlots(),
        dropConnections() {
          for (const socket of sockets) socket.destroy();
        },
        async close() {
          for (const socket of sockets) socket.destroy();
          server.close();
          await once(server, 'close');
        }
      };
    }

    it('a slots reply landing after destroy() creates no node clients and emits no error', async () => {
      const server = await startFakeNode();
      server.state.hold = true;
      const emitted: Array<string> = [];
      const slots = new RedisClusterSlots({
        rootNodes: [{ socket: { host: '127.0.0.1', port: server.port } }],
        RESP: 2
      }, ((event: string) => {
        emitted.push(event);
        return true;
      }) as never, 'test-cluster');

      try {
        const slotsRequested = server.nextSlotsRequest();
        const connecting = slots.connect();
        await slotsRequested;
        slots.destroy();
        server.release();

        await assert.rejects(connecting, /Cluster closed/);
        assert.equal(slots.nodeByAddress.size, 0, 'no node client may be created after destroy()');
        assert.deepEqual(emitted.filter(event => event === 'error'), []);
      } finally {
        slots.destroy();
        await server.close();
      }
    });

    it('a background topology refresh cut short by destroy() emits no error', async () => {
      const server = await startFakeNode();
      const emitted: Array<string> = [];
      let reconnects = 0;
      const slots = new RedisClusterSlots({
        rootNodes: [{ socket: { host: '127.0.0.1', port: server.port } }],
        RESP: 2,
        topologyRefreshOnReconnectionAttemptStrategy: 1
      }, ((event: string) => {
        emitted.push(event);
        // the second reconnect attempt schedules the refresh: let its
        // discovery client in, and hold its slots reply
        if (event === 'node-reconnecting' && ++reconnects === 2) {
          server.state.rejecting = false;
          server.state.hold = true;
        }
        return true;
      }) as never, 'test-cluster');

      try {
        await slots.connect();
        const slotsRequested = server.nextSlotsRequest();
        server.state.rejecting = true;
        server.dropConnections();
        await slotsRequested;
        slots.destroy();
        server.release();
        await new Promise(resolve => setTimeout(resolve, 50));

        assert.deepEqual(emitted.filter(event => event === 'error'), []);
      } finally {
        slots.destroy();
        await server.close();
      }
    });
  });

  describe('#handleSmigrated error recovery', () => {
    // #handleSmigrated is a private class-field arrow function. RedisClusterSlots
    // registers it as a SMIGRATED_EVENT listener on every client it creates via
    // #createClient. #createNodeClient sets node.client synchronously before
    // connect() is awaited, giving us a one-tick window to retrieve the bound
    // function via EventEmitter.listeners() before the terminal connect failure
    // clears it. This avoids any native-private-field access.
    function createSlots() {
      return new RedisClusterSlots({
        rootNodes: [{ socket: { host: '127.0.0.1', port: 1 } }],
        defaults: { socket: { host: '127.0.0.1', port: 1, reconnectStrategy: false, connectTimeout: 100 } },
      }, () => true, 'test-cluster');
    }

    function createNode() {
      return {
        address: '127.0.0.1:1',
        host: '127.0.0.1',
        port: 1,
        id: 'handler-probe',
        readonly: false,
      } as ShardNode<Record<string, never>, Record<string, never>, Record<string, never>, 3, Record<string, never>>;
    }

    it('unpauses destination nodes when an error is thrown after pausing them', async () => {
      const slots = createSlots();

      // nodeClient() calls #createNodeClient which sets node.client synchronously
      // before returning the connect Promise — grab the SMIGRATED listener before
      // the terminal connect failure clears node.client.
      const probe = createNode();
      const connectPromise = slots.nodeClient(probe);
      const [handler] = (probe.client as EventEmitter).listeners(SMIGRATED_EVENT) as [(e: SMigratedEvent) => Promise<void>];
      await assert.rejects(connectPromise as Promise<unknown>);

      // Track pause/unpause calls on a mock destination node.
      let destPauseCount = 0;
      let destUnpauseCount = 0;
      const destNode = {
        address: 'dest:6379',
        host: 'dest',
        port: 6379,
        client: {
          _pause:   () => { destPauseCount++; },
          _unpause: () => { destUnpauseCount++; },
        },
      } as unknown as MasterNode<Record<string, never>, Record<string, never>, Record<string, never>, 3, Record<string, never>>;

      // Source node whose _getQueue().extractCommandsForSlots throws, forcing
      // the catch path after the destination has already been paused (step 4
      // runs after the step-2 pause but before the step-5 unpause).
      const sourceNode = {
        address: 'source:6379',
        client: {
          _pause:   () => {},
          _unpause: () => {},
          _getQueue: () => ({
            extractCommandsForSlots: () => { throw new Error('forced'); },
          }),
        },
      } as unknown as MasterNode<Record<string, never>, Record<string, never>, Record<string, never>, 3, Record<string, never>>;

      slots.nodeByAddress.set('source:6379', sourceNode);
      slots.nodeByAddress.set('dest:6379', destNode);
      // Fill every slot with the destNode shard so that:
      //  (a) existingShard lookup succeeds (takes the existing-destination branch
      //      which pauses destNode before the forced throw), and
      //  (b) the debug-log line that does [...new Set(this.slots)] does not hit
      //      undefined.master on the sparse holes of the initial new Array(16384).
      slots.slots.fill({ master: destNode });

      const event: SMigratedEvent = {
        seqId: 1,
        entries: [{
          source: { host: 'source', port: 6379 },
          destinations: [{ addr: { host: 'dest', port: 6379 }, slots: [0] }],
        }],
      };

      // The handler catches its own errors and re-emits them; it must not throw.
      await handler(event);

      assert.equal(destPauseCount, 1, 'destination should have been paused during migration');
      assert.equal(destUnpauseCount, 1, 'destination must be unpaused even when an error aborts the migration');
    });
  });

  describe('connect() with an unreachable node', () => {
    // Two shards: the first master is the fake node itself (reachable), the
    // second sits on a dead port.
    let SLOTS_RESPONSE: string;

    let mockServer: net.Server;
    let mockPort: number;

    before(async () => {
      mockServer = net.createServer(socket => {
        socket.once('data', () => socket.write(SLOTS_RESPONSE));
      });

      await new Promise<void>((resolve, reject) => {
        mockServer.on('error', reject);
        mockServer.listen(0, '127.0.0.1', () => {
          mockPort = (mockServer.address() as net.AddressInfo).port;
          SLOTS_RESPONSE =
            '*2\r\n' +
            `*3\r\n:0\r\n:8191\r\n*3\r\n$9\r\n127.0.0.1\r\n:${mockPort}\r\n$5\r\nnode1\r\n` +
            '*3\r\n:8192\r\n:16383\r\n*3\r\n$9\r\n127.0.0.1\r\n:1\r\n$5\r\nnode2\r\n';
          resolve();
        });
      });
    });

    after(done => mockServer.close(done));

    it('does not report ready when retried against the same dead node', async () => {
      // The first connect() gives up, but the node client keeps reconnecting.
      // A retry must wait on it again rather than find nothing pending and
      // report a cluster whose shard is still offline.
      const slots = new RedisClusterSlots({
        rootNodes: [{ socket: { host: '127.0.0.1', port: mockPort } }],
        defaults: { disableClientInfo: true },
        connectTimeout: 500,
        RESP: 2 as const,
      }, () => true, 'test-cluster');

      try {
        await assert.rejects(
          withDeadline(slots.connect(), 15_000, 'first connect() did not settle'),
          ClusterNodeUnreachableError
        );
        await assert.rejects(
          withDeadline(slots.connect(), 15_000, 'second connect() did not settle'),
          ClusterNodeUnreachableError
        );
        assert.equal(slots.isReady, false);
      } finally {
        slots.destroy();
      }
    });

    it('tracks one connection when an address owns several slot ranges', async () => {
      // CLUSTER SLOTS may name the same master under non-contiguous ranges.
      // Tracking a second promise for that address would drop the first, and a
      // rejection on the dropped one has no handler left.
      const saved = SLOTS_RESPONSE;
      SLOTS_RESPONSE =
        '*2\r\n' +
        '*3\r\n:0\r\n:8191\r\n*3\r\n$9\r\n127.0.0.1\r\n:1\r\n$5\r\nnode1\r\n' +
        '*3\r\n:8192\r\n:16383\r\n*3\r\n$9\r\n127.0.0.1\r\n:1\r\n$5\r\nnode1\r\n';

      const slots = new RedisClusterSlots({
        rootNodes: [{ socket: { host: '127.0.0.1', port: mockPort } }],
        defaults: { disableClientInfo: true },
        connectTimeout: 500,
        RESP: 2 as const,
      }, () => true, 'test-cluster');

      try {
        await assert.rejects(
          withDeadline(slots.connect(), 15_000, 'connect() did not settle'),
          (err: Error) => {
            assert.ok(err instanceof ClusterNodeUnreachableError, err.message);
            assert.deepEqual(err.addresses, ['127.0.0.1:1']);
            return true;
          }
        );
      } finally {
        SLOTS_RESPONSE = saved;
        slots.destroy();
      }
    });

    it('settles instead of waiting for a node that never answers', async () => {
      // The default reconnect strategy retries forever, so a node that cannot
      // be reached never rejects its client's connect(). Awaiting it together
      // with the reachable nodes left connect() pending for good.
      const slots = new RedisClusterSlots({
        rootNodes: [{ socket: { host: '127.0.0.1', port: mockPort } }],
        defaults: { disableClientInfo: true },
        connectTimeout: 500,
        RESP: 2 as const,
      }, () => true, 'test-cluster');

      try {
        await assert.rejects(
          withDeadline(slots.connect(), 15_000, 'connect() did not settle'),
          (err: Error) => {
            assert.ok(err instanceof ClusterNodeUnreachableError, err.message);
            // Only the node on the dead port may be reported: the other one
            // connected, and the pub/sub connection is not a node.
            assert.deepEqual(err.addresses, ['127.0.0.1:1']);
            return true;
          }
        );
      } finally {
        slots.destroy();
      }
    });

    it('requeues a node promoted while its connect was in flight', async () => {
      // A replica that was still connecting comes back as a master. The role
      // change alone does not produce a new connection, so the in-flight one
      // has to be tracked again — otherwise the wait finds nothing pending and
      // reports the cluster ready with that shard offline.
      const saved = SLOTS_RESPONSE;
      SLOTS_RESPONSE =
        '*1\r\n*4\r\n:0\r\n:16383\r\n*3\r\n$9\r\n127.0.0.1\r\n' +
        `:${mockPort}\r\n$5\r\nnode1\r\n` +
        '*3\r\n$9\r\n127.0.0.1\r\n:1\r\n$5\r\nnode2\r\n';

      const slots = new RedisClusterSlots({
        rootNodes: [{ socket: { host: '127.0.0.1', port: mockPort } }],
        defaults: { disableClientInfo: true },
        connectTimeout: 500,
        useReplicas: true,
        RESP: 2 as const,
      }, () => true, 'test-cluster');

      try {
        await assert.rejects(
          withDeadline(slots.connect(), 15_000, 'first connect() did not settle'),
          ClusterNodeUnreachableError
        );

        // Same address, now the master of the only shard.
        SLOTS_RESPONSE =
          '*1\r\n*3\r\n:0\r\n:16383\r\n*3\r\n$9\r\n127.0.0.1\r\n:1\r\n$5\r\nnode2\r\n';

        await assert.rejects(
          withDeadline(slots.connect(), 15_000, 'second connect() did not settle'),
          (err: Error) => {
            assert.ok(err instanceof ClusterNodeUnreachableError, err.message);
            assert.deepEqual(err.addresses, ['127.0.0.1:1']);
            return true;
          }
        );
        assert.equal(slots.isReady, false);
      } finally {
        SLOTS_RESPONSE = saved;
        slots.destroy();
      }
    });

    it('keeps the pub/sub listeners when a moved handler meets an unreachable node', async () => {
      // The topology is installed before the nodes are awaited, so a node that
      // stays down must not abort the caller. `__MOVED` re-emits the listeners
      // it took away after rediscovering; losing that would silently drop every
      // subscription on a cluster that is otherwise serving traffic.
      const saved = SLOTS_RESPONSE;
      SLOTS_RESPONSE =
        '*1\r\n*3\r\n:0\r\n:16383\r\n*3\r\n$9\r\n127.0.0.1\r\n' +
        `:${mockPort}\r\n$5\r\nnode1\r\n`;

      const emitted: Array<{ event: string, payload: unknown }> = [];
      const slots = new RedisClusterSlots({
        rootNodes: [{ socket: { host: '127.0.0.1', port: mockPort } }],
        defaults: { disableClientInfo: true },
        connectTimeout: 500,
        RESP: 2 as const,
      }, (event: string, payload: unknown) => {
        emitted.push({ event, payload });
        return true;
      }, 'test-cluster');

      try {
        await withDeadline(slots.connect(), 15_000, 'connect() did not settle');

        const [moved] = (slots.masters[0].client as EventEmitter)
          .listeners('__MOVED') as [(listeners: unknown) => Promise<void>];
        assert.ok(moved, 'master client registers a __MOVED handler');

        // The refreshed topology names a node that never answers.
        SLOTS_RESPONSE =
          '*2\r\n*3\r\n:0\r\n:8191\r\n*3\r\n$9\r\n127.0.0.1\r\n' +
          `:${mockPort}\r\n$5\r\nnode1\r\n` +
          '*3\r\n:8192\r\n:16383\r\n*3\r\n$9\r\n127.0.0.1\r\n:1\r\n$5\r\nnode2\r\n';

        const listeners = {
          CHANNELS: new Map([['news', new Set<() => void>()]]),
          PATTERNS: new Map(),
          SHARDED: new Set(),
        };
        await withDeadline(moved(listeners), 15_000, '__MOVED handler did not settle');

        const resubscribed = emitted.find(({ event }) => event === RESUBSCRIBE_LISTENERS_EVENT);
        assert.ok(resubscribed,
          'the listeners taken from the old topology must be handed back');
        assert.equal(resubscribed.payload, listeners);
      } finally {
        SLOTS_RESPONSE = saved;
        slots.destroy();
      }
    });

    it('reports an unreachable node when a root-node refresh runs after connect', async () => {
      // The root-node fallback is shared by the initial connect and by refreshes
      // that find no usable known node. Only the first has a caller waiting for
      // the addresses, so the context has to come from the caller rather than
      // being assumed.
      const saved = SLOTS_RESPONSE;
      SLOTS_RESPONSE =
        '*1\r\n*3\r\n:0\r\n:16383\r\n*3\r\n$9\r\n127.0.0.1\r\n' +
        `:${mockPort}\r\n$5\r\nnode1\r\n`;

      const emitted: Array<{ event: string, payload: unknown }> = [];
      const slots = new RedisClusterSlots({
        rootNodes: [{ socket: { host: '127.0.0.1', port: mockPort } }],
        defaults: { disableClientInfo: true },
        connectTimeout: 500,
        RESP: 2 as const,
      }, (event: string, payload: unknown) => {
        emitted.push({ event, payload });
        return true;
      }, 'test-cluster');

      try {
        await withDeadline(slots.connect(), 15_000, 'connect() did not settle');

        SLOTS_RESPONSE =
          '*1\r\n*3\r\n:0\r\n:16383\r\n*3\r\n$9\r\n127.0.0.1\r\n:1\r\n$5\r\nnode2\r\n';

        // No known node can serve the topology, so the refresh falls back to the
        // root nodes — where the dead node is discovered. The per-address map is
        // left alone: destroy() walks it, and entries dropped here would keep
        // their clients reconnecting past teardown.
        slots.masters.length = 0;
        slots.replicas.length = 0;
        for (const node of slots.nodeByAddress.values()) {
          node.client?.destroy();
          node.client = undefined;
          node.connectPromise = undefined;
        }

        await withDeadline(slots.rediscover(), 15_000, 'rediscover() did not settle');

        const reported = emitted.find(({ event }) => event === 'error');
        assert.ok(reported,
          'a refresh with no connect() waiting must report the outage');
        assert.ok(reported.payload instanceof ClusterNodeUnreachableError,
          String(reported.payload));
      } finally {
        SLOTS_RESPONSE = saved;
        slots.destroy();
      }
    });

    it('starts a new connection for a node whose last one failed for good', async () => {
      // When a node's own reconnect strategy gives up, the client is dropped and
      // its connect promise settles, so a retry finds neither. Without starting a
      // connection there is nothing to wait for, and the cluster is reported ready
      // while that shard is offline.
      const saved = SLOTS_RESPONSE;
      SLOTS_RESPONSE =
        '*1\r\n*3\r\n:0\r\n:16383\r\n*3\r\n$9\r\n127.0.0.1\r\n:1\r\n$5\r\nnode1\r\n';

      const slots = new RedisClusterSlots({
        rootNodes: [{ socket: { host: '127.0.0.1', port: mockPort } }],
        defaults: { disableClientInfo: true },
        connectTimeout: 500,
        RESP: 2 as const,
      }, () => true, 'test-cluster');

      try {
        await assert.rejects(
          withDeadline(slots.connect(), 15_000, 'first connect() did not settle'),
          ClusterNodeUnreachableError
        );

        // Put the node in the state a terminal connect failure leaves behind:
        // the client is gone and the promise has settled.
        const node = slots.nodeByAddress.get('127.0.0.1:1');
        assert.ok(node, 'the discovered node is remembered');
        node.client?.destroy();
        node.client = undefined;
        node.connectPromise = undefined;

        await assert.rejects(
          withDeadline(slots.connect(), 15_000, 'second connect() did not settle'),
          ClusterNodeUnreachableError
        );
        assert.equal(slots.isReady, false);
      } finally {
        SLOTS_RESPONSE = saved;
        slots.destroy();
      }
    });

  });

  describe('pubSubNode stale pointer and callback guard', () => {
    // Minimal CLUSTER SLOTS response: 1 shard [0-16383], master at 127.0.0.1:1 (dead port)
    const SLOTS_RESPONSE =
      '*1\r\n*3\r\n:0\r\n:16383\r\n*3\r\n$9\r\n127.0.0.1\r\n:1\r\n$5\r\nnode1\r\n';

    let mockServer: net.Server;
    let mockPort: number;

    before(async () => {
      mockServer = net.createServer(socket => {
        socket.once('data', () => socket.write(SLOTS_RESPONSE));
      });

      await new Promise<void>((resolve, reject) => {
        mockServer.on('error', reject);
        mockServer.listen(0, '127.0.0.1', () => {
          mockPort = (mockServer.address() as net.AddressInfo).port;
          resolve();
        });
      });
    });

    after(done => mockServer.close(done));

    function createSlots() {
      return new RedisClusterSlots({
        rootNodes: [{ socket: { host: '127.0.0.1', port: mockPort } }],
        defaults: {
          socket: { reconnectStrategy: false, connectTimeout: 500 },
          disableClientInfo: true,
        },
        minimizeConnections: true,
        RESP: 2 as const,
      }, () => true, 'test-cluster');
    }

    // When #discover() removes the pub-sub node's address from the topology and
    // both listener maps are empty, pubSubNode must be nulled (fix: cluster-slots.ts
    // line ~381). Without the fix, pubSubNode kept pointing at the destroyed client;
    // getPubSubClient() then returned Promise.resolve(destroyedClient), causing
    // ClientClosedError on every subsequent subscribe.
    it('pubSubNode is undefined after topology removes the pub-sub address', async function () {
      this.timeout(5000);

      const slots = createSlots();
      await slots.connect();

      // Plant a pubSubNode at an address NOT in the mock topology so that
      // #discover() destroys and nulls it on the next rediscovery.
      slots.pubSubNode = {
        address: '127.0.0.1:9999',
        client: {
          _clientId: 'stale-pub-sub',
          destroy() {},
          getPubSubListeners: () => new Map(),
        },
      } as unknown as NonNullable<typeof slots.pubSubNode>;

      // Trigger topology rediscovery — #discover() sees pubSubNode.address is
      // not in addressesInUse and calls destroy() + sets pubSubNode = undefined.
      await slots.rediscover();

      assert.equal(slots.pubSubNode, undefined,
        'pubSubNode must be cleared when the address leaves the topology with no listeners');

      slots.destroy();
    });

    // When a second topology rediscovery fires while the first pub-sub connection
    // is still connecting, the first connection's .catch callback must not null a
    // newer pubSubNode that was set by the second rediscovery.
    it('catch callback does not clear a newer pubSubNode', async function () {
      this.timeout(5000);

      const slots = createSlots();
      await slots.connect();

      // Triggers #initiatePubSubClient() → picks the single master at 127.0.0.1:1
      // (dead port). The method sets slots.pubSubNode synchronously, then returns
      // a connectPromise that will reject with ECONNREFUSED.
      const connectPromise = slots.getPubSubClient();
      const originalPubSubNode = slots.pubSubNode;
      assert.ok(originalPubSubNode, 'pubSubNode set synchronously by #initiatePubSubClient');

      // Simulate a concurrent topology rediscovery replacing pubSubNode before
      // the in-flight connection fails.
      const mockNewerNode = { address: '127.0.0.1:2', client: { destroy() {} } } as unknown as NonNullable<typeof slots.pubSubNode>;
      slots.pubSubNode = mockNewerNode;

      // Let the original connection attempt reject (ECONNREFUSED to port 1).
      await assert.rejects(connectPromise);

      // The guard in #initiatePubSubClient's .catch:
      //   if (this.pubSubNode === pubSubNode) { this.pubSubNode = undefined; }
      // must NOT have fired because this.pubSubNode was already replaced.
      assert.equal(slots.pubSubNode, mockNewerNode,
        'catch callback must not clear a newer pubSubNode');

      slots.destroy();
    });

    // A multi-db pub/sub move tears down a still-connecting sharded client and
    // can seat a replacement on the same master before that connect rejects.
    it('a torn-down sharded connect does not clear a newer master.pubSub', async function () {
      this.timeout(5000);

      const slots = createSlots();
      await slots.connect();

      const connectPromise = slots.getShardedPubSubClient('channel');
      const master = slots.masters[0];
      assert.ok(master.pubSub, 'master.pubSub set synchronously by #initiateShardedPubSubClient');

      // the move away destroys the connecting client and clears the slot...
      slots.removeAllPubSubListeners();
      assert.equal(master.pubSub, undefined);

      // ...and a move back seats a replacement before the stale connect settles
      const replacement = {
        client: { _clientId: 'replacement', destroy() {} }
      } as unknown as NonNullable<typeof master.pubSub>;
      master.pubSub = replacement;

      await assert.rejects(connectPromise);

      assert.equal(master.pubSub, replacement,
        'a stale connect rejection must not clear the replacement');

      slots.destroy();
    });
  });
});
