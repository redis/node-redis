import assert from 'node:assert';
import RedisCommandsQueue from './commands-queue';
import { PUBSUB_TYPE } from './pub-sub';
import { AbortError, DisconnectsClientError, TimeoutError } from '../errors';

describe('RedisCommandsQueue', () => {
  function createQueue() {
    return new RedisCommandsQueue(3, null, () => {}, 'test-client');
  }

  function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  describe('extractAllCommands', () => {
    it('returns and removes every queued command, not just the first one', () => {
      const queue = createQueue();
      for (let i = 0; i < 5; i++) {
        queue.addCommand([`CMD${i}`]).catch(() => {});
      }

      const extracted = queue.extractAllCommands();

      assert.strictEqual(extracted.length, 5);
      assert.deepStrictEqual(
        extracted.map(command => command.args?.[0]),
        ['CMD0', 'CMD1', 'CMD2', 'CMD3', 'CMD4'],
      );
      assert.strictEqual(queue.extractAllCommands().length, 0);
    });
  });

  describe('chainInExecution', () => {
    it('is undefined before anything is written, and matches a chain once part of it is sent', () => {
      const queue = createQueue();
      const chainId = Symbol('MULTI Chain');

      assert.strictEqual(queue.chainInExecution, undefined);

      queue.addCommand(['MULTI'], { chainId }).catch(() => {});
      queue.addCommand(['SET', 'k', 'v'], { chainId }).catch(() => {});
      queue.addCommand(['EXEC'], { chainId }).catch(() => {});

      // Nothing sent yet - the whole chain is still just sitting in #toWrite.
      assert.strictEqual(queue.chainInExecution, undefined);

      const writer = queue.commandsToWrite();
      writer.next(); // "sends" MULTI
      writer.next(); // "sends" SET

      // Two of the three commands are now in #waitingForReply (out of view);
      // chainInExecution should point at this chain, and the one command
      // still in #toWrite (EXEC) should carry a matching chainId - that's
      // the tail-of-an-in-flight-chain signal cluster-slots.ts relies on.
      assert.strictEqual(queue.chainInExecution, chainId);

      const remaining = queue.extractAllCommands();
      assert.strictEqual(remaining.length, 1);
      assert.strictEqual(remaining[0].chainId, queue.chainInExecution);
    });

    it('leaves a finished chain with no queued tail to relocate', () => {
      const queue = createQueue();
      const chainId = Symbol('MULTI Chain');

      queue.addCommand(['MULTI'], { chainId }).catch(() => {});
      queue.addCommand(['EXEC'], { chainId }).catch(() => {});

      const writer = queue.commandsToWrite();
      writer.next(); // "sends" MULTI
      writer.next(); // "sends" EXEC - whole chain is now in #waitingForReply

      // The whole chain was sent, so nothing of it remains in #toWrite -
      // extractAllCommands has nothing left to (mis)classify as its tail.
      assert.strictEqual(queue.chainInExecution, chainId);
      assert.strictEqual(queue.extractAllCommands().length, 0);
    });
  });

  describe('extractCommandsForSlots', () => {
    it('leaves the queued tail of an in-flight chain and everything after it in place', () => {
      const queue = createQueue();
      const chainId = Symbol('MULTI Chain');

      queue.addCommand(['MULTI'], { chainId, slotNumber: 1 }).catch(() => {});
      queue.addCommand(['SET', 'k', 'v'], { chainId, slotNumber: 1 }).catch(() => {});
      queue.addCommand(['EXEC'], { chainId, slotNumber: 1 }).catch(() => {});
      // Queued after the chain, on the same connection. If this were
      // relocated to another node while the transaction is still pending
      // here, it could run before the transaction completes - reading 'k'
      // before SET applies, even though it was queued after EXEC.
      queue.addCommand(['GET', 'k'], { slotNumber: 1 }).catch(() => {});

      const writer = queue.commandsToWrite();
      writer.next(); // "sends" MULTI - SET, EXEC and GET are still queued behind it

      const extracted = queue.extractCommandsForSlots(new Set([1]));

      // Nothing is extracted: reaching the in-flight chain's tail stops the
      // scan entirely, so GET stays behind it in queue order too.
      assert.deepStrictEqual(extracted, []);
      assert.strictEqual(queue.pendingCount, 4);
    });

    it('is unaffected by an already-fully-sent chain', () => {
      const queue = createQueue();
      const chainId = Symbol('MULTI Chain');

      queue.addCommand(['MULTI'], { chainId, slotNumber: 1 }).catch(() => {});
      queue.addCommand(['EXEC'], { chainId, slotNumber: 1 }).catch(() => {});
      queue.addCommand(['GET', 'k'], { slotNumber: 1 }).catch(() => {});

      const writer = queue.commandsToWrite();
      writer.next(); // "sends" MULTI
      writer.next(); // "sends" EXEC - the whole chain is now in #waitingForReply

      const extracted = queue.extractCommandsForSlots(new Set([1]));

      // chainInExecution still points at this chain (nothing has been sent
      // since), but none of its commands remain in #toWrite to (mis)match -
      // the trailing GET is extracted normally.
      assert.strictEqual(queue.chainInExecution, chainId);
      assert.deepStrictEqual(
        extracted.map(command => command.args?.[0]),
        ['GET'],
      );
    });

    it('extracts a second, fully-queued chain atomically without mistaking it for the in-flight chain\'s tail', () => {
      const queue = createQueue();
      const chainA = Symbol('Chain A (in-flight, different slot)');
      const chainB = Symbol('Chain B (fully queued, migrating slot)');

      // Chain A is in flight on a slot that isn't migrating - its queued
      // tail (SET, EXEC) carries a chainId that will equal chainInExecution.
      queue.addCommand(['MULTI'], { chainId: chainA, slotNumber: 5 }).catch(() => {});
      queue.addCommand(['SET', 'a', '1'], { chainId: chainA, slotNumber: 5 }).catch(() => {});
      queue.addCommand(['EXEC'], { chainId: chainA, slotNumber: 5 }).catch(() => {});

      // Chain B is queued entirely behind chain A, on the slot that IS
      // migrating. None of its commands have been sent, so none of them
      // carry chainInExecution's id - it's a distinct chain, not a
      // continuation of chain A's tail.
      queue.addCommand(['MULTI'], { chainId: chainB, slotNumber: 1 }).catch(() => {});
      queue.addCommand(['SET', 'b', '2'], { chainId: chainB, slotNumber: 1 }).catch(() => {});
      queue.addCommand(['EXEC'], { chainId: chainB, slotNumber: 1 }).catch(() => {});

      const writer = queue.commandsToWrite();
      writer.next(); // "sends" chain A's MULTI - chainInExecution now points at chain A

      const extracted = queue.extractCommandsForSlots(new Set([1]));

      // Chain A's tail lives on slot 5, so it's skipped over (not in the
      // migrating slot set) without ever triggering the in-flight-tail
      // guard. Chain B, entirely on slot 1, is then extracted as a whole -
      // its distinct chainId never matches chainInExecution, so it's never
      // mistaken for chain A's tail and relocates atomically, in order.
      assert.deepStrictEqual(
        extracted.map(command => command.args?.[0]),
        ['MULTI', 'SET', 'EXEC'],
      );
      assert.ok(extracted.every(command => command.chainId === chainB));

      // Chain A's tail stays behind, untouched, on its own slot.
      const remaining = queue.extractAllCommands();
      assert.deepStrictEqual(
        remaining.map(command => command.args?.[0]),
        ['SET', 'EXEC'],
      );
    });
  });

  describe('addCommand', () => {
    it('does not keep a command if timeout listener setup fails', async () => {
      const queue = createQueue();

      const promise = queue.addCommand(['CMD'], { timeout: -1 });

      await assert.rejects(promise, RangeError);
      assert.strictEqual(queue.extractAllCommands().length, 0);
    });
  });

  describe('rejectCommands', () => {
    // Mirrors cluster-slots.ts's full-node-loss path: extractAllCommands()
    // drains everything, then rejects it when no destination client exists.
    it('rejects a command extracted via extractAllCommands when there is no destination', async () => {
      const source = createQueue();
      const promise = source.addCommand(['CMD'], { timeout: 1000 });
      promise.catch(() => {});

      const [command] = source.extractAllCommands();
      source.rejectCommands([command], new DisconnectsClientError());

      await assert.rejects(promise, DisconnectsClientError);
      assert.strictEqual(source.extractAllCommands().length, 0);
    });

    // Mirrors cluster-slots.ts's partial-slot-migration path:
    // extractCommandsForSlots() pulls out only the moving slots, then rejects
    // them when no destination client exists, leaving the rest queued.
    it('rejects a command extracted via extractCommandsForSlots when there is no destination', async () => {
      const source = createQueue();
      const promise = source.addCommand(['CMD'], { slotNumber: 1, timeout: 1000 });
      promise.catch(() => {});
      source.addCommand(['KEEP'], { slotNumber: 2 });

      const [command] = source.extractCommandsForSlots(new Set([1]));
      source.rejectCommands([command], new DisconnectsClientError());

      await assert.rejects(promise, DisconnectsClientError);
      assert.strictEqual(source.extractAllCommands().length, 1);
    });
  });

  describe('full node loss (in-flight chain)', () => {
    // Mirrors cluster-slots.ts's full-node-loss path: extractAllCommands()
    // pulls the in-flight chain's queued tail out of #toWrite and rejects it
    // explicitly, then the source client is destroyed, which calls
    // flushAll() and rejects whatever's left in #waitingForReply - the
    // chain's already-sent head. Both halves need to reject; otherwise the
    // transaction half-commits: the server already applied the head against
    // a connection this client is abandoning, while the tail is rejected as
    // never sent.
    it('rejects the already-sent head of an in-flight chain along with its queued tail', async () => {
      const queue = createQueue();
      const chainId = Symbol('MULTI Chain');

      const multiPromise = queue.addCommand(['MULTI'], { chainId });
      const setPromise = queue.addCommand(['SET', 'k', 'v'], { chainId });
      const execPromise = queue.addCommand(['EXEC'], { chainId });
      [multiPromise, setPromise, execPromise].forEach(promise => promise.catch(() => {}));

      const writer = queue.commandsToWrite();
      writer.next(); // "sends" MULTI - now in #waitingForReply
      writer.next(); // "sends" SET - now in #waitingForReply

      // EXEC is still the queued tail in #toWrite.
      const remaining = queue.extractAllCommands();
      assert.strictEqual(remaining.length, 1);
      assert.strictEqual(remaining[0].chainId, queue.chainInExecution);

      // cluster-slots.ts rejects the queued tail explicitly, since it can't
      // be safely relocated to another node...
      queue.rejectCommands(remaining, new DisconnectsClientError());

      // ...then destroy()'s call to flushAll() rejects whatever's left in
      // #waitingForReply - the already-sent MULTI and SET.
      queue.flushAll(new DisconnectsClientError());

      await Promise.all([
        assert.rejects(multiPromise, DisconnectsClientError),
        assert.rejects(setPromise, DisconnectsClientError),
        assert.rejects(execPromise, DisconnectsClientError),
      ]);
    });
  });

  describe('prependCommandsToWrite', () => {

    it('rebinds an abort listener so it removes the command from its new queue', async () => {
      const source = createQueue();
      const destination = createQueue();
      const controller = new AbortController();

      const promise = source.addCommand(['CMD'], { abortSignal: controller.signal });
      promise.catch(() => {});

      const [command] = source.extractAllCommands();
      destination.prependCommandsToWrite([command]);

      controller.abort();
      await assert.rejects(promise, AbortError);

      assert.strictEqual(destination.extractAllCommands().length, 0);
    });

    it('does not keep a command if its abort signal fired before prepend', async () => {
      const source = createQueue();
      const destination = createQueue();
      const controller = new AbortController();

      const promise = source.addCommand(['CMD'], {
        abortSignal: controller.signal,
        slotNumber: 1,
      });
      promise.catch(() => {});
      source.addCommand(['KEEP'], { slotNumber: 2 });

      const [command] = source.extractCommandsForSlots(new Set([1]));
      controller.abort();
      destination.prependCommandsToWrite([command]);

      await assert.rejects(promise, AbortError);
      assert.strictEqual(source.extractAllCommands().length, 1);
      assert.strictEqual(destination.extractAllCommands().length, 0);
    });

    it('rebinds a timeout listener so it removes the command from its new queue', async () => {
      const source = createQueue();
      const destination = createQueue();

      const promise = source.addCommand(['CMD'], { timeout: 10 });
      promise.catch(() => {});

      const [command] = source.extractAllCommands();
      destination.prependCommandsToWrite([command]);

      await assert.rejects(promise, TimeoutError);
      assert.strictEqual(destination.extractAllCommands().length, 0);
    });

    it('does not keep a command if its timeout fired before prepend', async () => {
      const source = createQueue();
      const destination = createQueue();

      const promise = source.addCommand(['CMD'], {
        slotNumber: 1,
        timeout: 1,
      });
      promise.catch(() => {});
      source.addCommand(['KEEP'], { slotNumber: 2 });

      const [command] = source.extractCommandsForSlots(new Set([1]));
      await wait(5);
      // Confirm the timeout actually already fired, so prependCommandsToWrite
      // is exercising the "reject immediately" branch below and not just
      // rebinding a listener that happens to fire before the final assert.
      assert.strictEqual(command.timeout?.signal.aborted, true);
      destination.prependCommandsToWrite([command]);

      await assert.rejects(promise, TimeoutError);
      assert.strictEqual(source.extractAllCommands().length, 1);
      assert.strictEqual(destination.extractAllCommands().length, 0);
    });

    it('removes the timeout listener when abort wins after prepend', async () => {
      const source = createQueue();
      const destination = createQueue();
      const controller = new AbortController();

      const promise = source.addCommand(['CMD'], {
        abortSignal: controller.signal,
        timeout: 5,
      });
      promise.catch(() => {});
      destination.addCommand(['KEEP']);

      const [command] = source.extractAllCommands();
      destination.prependCommandsToWrite([command]);

      controller.abort();
      await assert.rejects(promise, AbortError);
      await wait(10);

      assert.strictEqual(destination.extractAllCommands().length, 1);
    });

    it('removes the abort listener when timeout already fired before prepend', async () => {
      const source = createQueue();
      const destination = createQueue();
      const controller = new AbortController();

      const promise = source.addCommand(['CMD'], {
        abortSignal: controller.signal,
        slotNumber: 1,
        timeout: 1,
      });
      promise.catch(() => {});
      source.addCommand(['KEEP'], { slotNumber: 2 });

      const [command] = source.extractCommandsForSlots(new Set([1]));
      await wait(5);
      // Confirm the timeout actually already fired before prepend, so the
      // abort listener removed below is the one attached at addCommand time,
      // not a listener that would have been rebound had we hit that branch.
      assert.strictEqual(command.timeout?.signal.aborted, true);

      destination.prependCommandsToWrite([command]);
      await assert.rejects(promise, TimeoutError);

      controller.abort();

      assert.strictEqual(source.extractAllCommands().length, 1);
      assert.strictEqual(destination.extractAllCommands().length, 0);
    });

    it('rebinds listeners for every command when extractAllCommands returns multiple commands', async () => {
      const source = createQueue();
      const destination = createQueue();
      const controllers = [
        new AbortController(),
        new AbortController(),
        new AbortController(),
      ];
      const settled = [false, false, false];

      const promises = controllers.map((controller, i) => {
        const promise = source.addCommand([`CMD${i}`], { abortSignal: controller.signal });
        promise.catch(() => {}).finally(() => { settled[i] = true; });
        return promise;
      });

      const commands = source.extractAllCommands();
      assert.strictEqual(commands.length, 3);
      assert.deepStrictEqual(
        commands.map(command => command.args?.[0]),
        ['CMD0', 'CMD1', 'CMD2'],
      );

      destination.prependCommandsToWrite(commands);
      assert.strictEqual(destination.pendingCount, 3);
      assert.strictEqual(source.pendingCount, 0);

      // Abort out of order (middle, then last, then first) to confirm each
      // command's listener was independently rebound to its own node in the
      // destination queue, and that cancelling one doesn't settle or corrupt
      // the others still queued.
      controllers[1].abort();
      await assert.rejects(promises[1], AbortError);
      assert.deepStrictEqual(settled, [false, true, false]);
      assert.strictEqual(destination.pendingCount, 2);

      controllers[2].abort();
      await assert.rejects(promises[2], AbortError);
      assert.deepStrictEqual(settled, [false, true, true]);
      assert.strictEqual(destination.pendingCount, 1);

      controllers[0].abort();
      await assert.rejects(promises[0], AbortError);
      assert.deepStrictEqual(settled, [true, true, true]);

      // Check the destination queue by actually traversing it (not just its
      // length counter), to confirm the linked list itself wasn't corrupted
      // by the three removals above.
      assert.strictEqual(destination.extractAllCommands().length, 0);

      // None of the cancellations should have reached back into the
      // already-drained source queue.
      assert.strictEqual(source.extractAllCommands().length, 0);
    });
  });

  describe('pubsub push after a connection error', () => {
    it('drops a stale subscribe confirmation instead of crashing', () => {
      const queue = createQueue();
      queue.subscribe(PUBSUB_TYPE.CHANNELS, 'foo', () => {}).catch(() => {});

      // move the SUBSCRIBE command into #waitingForReply, as the socket
      // writer does right before the bytes go out on the wire
      queue.commandsToWrite().next();

      // a connection error flushes #waitingForReply before the server's
      // confirmation for that SUBSCRIBE is processed
      queue.flushWaitingForReply(new Error('simulated connection error'));

      // the confirmation was already in flight on the wire and arrives anyway
      assert.doesNotThrow(() => {
        queue.decoder.onPush([Buffer.from('subscribe'), Buffer.from('foo'), 1]);
      });
    });
  });
});
