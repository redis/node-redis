import { strict as assert } from 'node:assert';
import RedisCommandsQueue from './commands-queue';
import { RESP_TYPES } from '../RESP/decoder';

/**
 * Drains all pending write-queue entries into the waiting-for-reply queue.
 * This simulates the socket layer consuming commandsToWrite() before the
 * server sends a reply.
 */
function drainToWrite(queue: RedisCommandsQueue) {
  for (const _ of queue.commandsToWrite()) {
    // intentionally empty – we only care about the side-effect of moving
    // entries from #toWrite → #waitingForReply
  }
}

/** Creates a RESP2 queue with no max-length limit. */
function makeQueue() {
  return new RedisCommandsQueue(2, undefined, () => {});
}

describe('RedisCommandsQueue', () => {
  describe('reset()', () => {
    it('resolves when the RESET reply is decoded as a plain string (no typeMapping)', async () => {
      const queue = makeQueue();
      const resetPromise = queue.reset(Symbol());
      drainToWrite(queue);
      // No typeMapping → SIMPLE_STRING → string
      queue.decoder.write(Buffer.from('+RESET\r\n'));
      await resetPromise; // must not hang
    });

    it('resolves when the RESET reply is decoded as a Buffer', async () => {
      const queue = makeQueue();
      const typeMapping = { [RESP_TYPES.SIMPLE_STRING]: Buffer };
      const resetPromise = queue.reset(Symbol(), typeMapping);
      drainToWrite(queue);
      // typeMapping → SIMPLE_STRING → Buffer
      queue.decoder.write(Buffer.from('+RESET\r\n'));
      await resetPromise; // must not hang
    });

    it('resolves when the RESET reply is decoded as a Uint8Array', async () => {
      const queue = makeQueue();
      const typeMapping = { [RESP_TYPES.SIMPLE_STRING]: Uint8Array };
      const resetPromise = queue.reset(Symbol(), typeMapping);
      drainToWrite(queue);
      // typeMapping → SIMPLE_STRING → Uint8Array
      // Before the fix, the reset handler only checked for `string` and
      // `Buffer`, so a Uint8Array reply caused reset() to hang forever.
      queue.decoder.write(Buffer.from('+RESET\r\n'));
      await resetPromise; // must not hang
    });
  });

  describe('monitor() + reset() with SIMPLE_STRING -> Uint8Array typeMapping', () => {
    it('delivers monitor events as Uint8Array', async () => {
      const queue = makeQueue();
      const typeMapping = { [RESP_TYPES.SIMPLE_STRING]: Uint8Array };
      const monitorReplies: unknown[] = [];

      const monitorPromise = queue.monitor(
        reply => monitorReplies.push(reply),
        { typeMapping }
      );
      drainToWrite(queue);

      // Simulate Redis acknowledging MONITOR with "+OK"
      queue.decoder.write(Buffer.from('+OK\r\n'));
      await monitorPromise;

      // Simulate a monitor event line
      queue.decoder.write(Buffer.from('+1234567890.123 [0 127.0.0.1:1234] "PING"\r\n'));

      assert.equal(monitorReplies.length, 1, 'monitor callback should have been called once');
      assert.ok(
        monitorReplies[0] instanceof Uint8Array,
        `expected Uint8Array reply from monitor, got ${Object.prototype.toString.call(monitorReplies[0])}`
      );
      assert.ok(
        !(monitorReplies[0] instanceof Buffer),
        'Uint8Array reply must not be a Buffer instance'
      );
    });

    it('reset() resolves and does not forward Uint8Array RESET reply to the monitor callback', async () => {
      const queue = makeQueue();
      const typeMapping = { [RESP_TYPES.SIMPLE_STRING]: Uint8Array };
      let monitorCallCount = 0;

      const monitorPromise = queue.monitor(
        () => { monitorCallCount++; },
        { typeMapping }
      );
      drainToWrite(queue);
      queue.decoder.write(Buffer.from('+OK\r\n'));
      await monitorPromise;

      // Issue RESET while the queue is in monitor mode
      const resetPromise = queue.reset(Symbol(), typeMapping);
      drainToWrite(queue);

      // The decoder still uses the monitor's Uint8Array typeMapping, so the
      // +RESET reply arrives as a Uint8Array.  Before the fix this caused
      // reset() to forward the reply to the monitor callback instead of
      // resolving, leaving the promise dangling and incrementing
      // monitorCallCount unexpectedly.
      queue.decoder.write(Buffer.from('+RESET\r\n'));
      await resetPromise; // must resolve, not hang

      assert.equal(
        monitorCallCount,
        0,
        'RESET reply must not be forwarded to the monitor callback'
      );
    });

    it('reset() resolves after a monitor event has already been delivered', async () => {
      const queue = makeQueue();
      const typeMapping = { [RESP_TYPES.SIMPLE_STRING]: Uint8Array };
      const monitorReplies: unknown[] = [];

      const monitorPromise = queue.monitor(
        reply => monitorReplies.push(reply),
        { typeMapping }
      );
      drainToWrite(queue);
      queue.decoder.write(Buffer.from('+OK\r\n'));
      await monitorPromise;

      // Deliver one monitor event so the callback is exercised before reset
      queue.decoder.write(Buffer.from('+1234567890.123 [0 127.0.0.1:1] "SET" "k" "v"\r\n'));
      assert.equal(monitorReplies.length, 1);

      // Now reset – the Uint8Array RESET reply must not be passed to the
      // monitor callback, and the promise must resolve cleanly.
      const resetPromise = queue.reset(Symbol(), typeMapping);
      drainToWrite(queue);
      queue.decoder.write(Buffer.from('+RESET\r\n'));
      await resetPromise;

      assert.equal(
        monitorReplies.length,
        1,
        'only the genuine monitor event should have reached the callback'
      );
    });
  });
});
