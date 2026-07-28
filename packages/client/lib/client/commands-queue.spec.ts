import assert from 'node:assert';
import RedisCommandsQueue from './commands-queue';
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
});
