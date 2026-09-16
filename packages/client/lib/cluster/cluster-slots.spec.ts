import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';
import { RedisClusterClientOptions } from './index';
import RedisClusterSlots, { groupCommandsByDestination, splitInFlightChainTail } from './cluster-slots';
import type { MasterNode, Shard, ShardNode } from './cluster-slots';
import type { CommandToWrite } from '../client/commands-queue';
import { ClientClosedError } from '../errors';
import { SMIGRATED_EVENT, type SMigratedEvent } from '../client/enterprise-maintenance-manager';

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
      const [handler] = (probe.client as any).listeners(SMIGRATED_EVENT) as [(e: SMigratedEvent) => Promise<void>];
      await assert.rejects(connectPromise as Promise<unknown>);

      // Track pause/unpause calls on a mock destination node.
      let destPauseCount = 0;
      let destUnpauseCount = 0;
      const destNode: any = {
        address: 'dest:6379',
        host: 'dest',
        port: 6379,
        client: {
          _pause:   () => { destPauseCount++; },
          _unpause: () => { destUnpauseCount++; },
        },
      };

      // Source node whose _getQueue().extractCommandsForSlots throws, forcing
      // the catch path after the destination has already been paused (step 4
      // runs after the step-2 pause but before the step-5 unpause).
      const sourceNode: any = {
        address: 'source:6379',
        client: {
          _pause:   () => {},
          _unpause: () => {},
          _getQueue: () => ({
            extractCommandsForSlots: () => { throw new Error('forced'); },
          }),
        },
      };

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
});
