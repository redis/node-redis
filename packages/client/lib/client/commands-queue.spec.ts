import { strict as assert } from 'node:assert';
import RedisCommandsQueue from './commands-queue';
import { RESP_TYPES } from '../RESP/decoder';
import { PUBSUB_TYPE } from './pub-sub';

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

  describe('RESP2 pub/sub PING with SIMPLE_STRING typeMapping', () => {
    /**
     * Helper: subscribe to one channel on a fresh RESP2 queue and await the
     * subscribe acknowledgement so that #setupPubSubHandler is active.
     *
     * RESP2 subscribe ack wire format:
     *   *3\r\n$9\r\nsubscribe\r\n$4\r\ntest\r\n:1\r\n
     */
    async function makeSubscribedQueue(typeMapping?: Record<number, unknown>) {
      const queue = makeQueue();
      const subscribePromise = queue.subscribe(PUBSUB_TYPE.CHANNELS, 'test', () => {});
      drainToWrite(queue);
      queue.decoder.write(Buffer.from('*3\r\n$9\r\nsubscribe\r\n$4\r\ntest\r\n:1\r\n'));
      await subscribePromise;
      return queue;
    }

    // RESP2 pub/sub PONG wire reply for PING with no message:
    //   *2\r\n$4\r\npong\r\n$0\r\n\r\n
    const PONG_WIRE = Buffer.from('*2\r\n$4\r\npong\r\n$0\r\n\r\n');

    it('resolves PING as a Uint8Array when SIMPLE_STRING is mapped to Uint8Array', async () => {
      // Before the fix, the branch `typeMapping?.[RESP_TYPES.SIMPLE_STRING] === Buffer`
      // was the only truthy path; Uint8Array fell through to buffer.toString(), so the
      // caller received a plain string instead of a Uint8Array.
      const queue = await makeSubscribedQueue();
      const typeMapping = { [RESP_TYPES.SIMPLE_STRING]: Uint8Array };
      const pingPromise = queue.addCommand<unknown>(['PING'], { typeMapping });
      drainToWrite(queue);
      queue.decoder.write(PONG_WIRE);

      const result = await pingPromise;

      assert.ok(
        result instanceof Uint8Array,
        `expected Uint8Array, got ${Object.prototype.toString.call(result)}`
      );
      assert.ok(
        !(result instanceof Buffer),
        'Uint8Array reply must not be a Buffer instance'
      );
      // The payload for a no-message PING is the "pong" text itself.
      assert.deepEqual(result, new Uint8Array(Buffer.from('pong')));
    });

    it('resolves PING as a Buffer when SIMPLE_STRING is mapped to Buffer', async () => {
      const queue = await makeSubscribedQueue();
      const typeMapping = { [RESP_TYPES.SIMPLE_STRING]: Buffer };
      const pingPromise = queue.addCommand<unknown>(['PING'], { typeMapping });
      drainToWrite(queue);
      queue.decoder.write(PONG_WIRE);

      const result = await pingPromise;

      assert.ok(
        result instanceof Buffer,
        `expected Buffer, got ${Object.prototype.toString.call(result)}`
      );
      assert.deepEqual(result, Buffer.from('pong'));
    });

    it('resolves PING as a string when no typeMapping is provided', async () => {
      const queue = await makeSubscribedQueue();
      const pingPromise = queue.addCommand<unknown>(['PING']);
      drainToWrite(queue);
      queue.decoder.write(PONG_WIRE);

      const result = await pingPromise;

      assert.equal(typeof result, 'string', `expected string, got ${Object.prototype.toString.call(result)}`);
      assert.equal(result, 'pong');
    });

    it('resolves PING with message as Uint8Array when SIMPLE_STRING is mapped to Uint8Array', async () => {
      // RESP2 PING "hello" reply: *2\r\n$4\r\npong\r\n$5\r\nhello\r\n
      const queue = await makeSubscribedQueue();
      const typeMapping = { [RESP_TYPES.SIMPLE_STRING]: Uint8Array };
      const pingPromise = queue.addCommand<unknown>(['PING', 'hello'], { typeMapping });
      drainToWrite(queue);
      queue.decoder.write(Buffer.from('*2\r\n$4\r\npong\r\n$5\r\nhello\r\n'));

      const result = await pingPromise;

      assert.ok(
        result instanceof Uint8Array,
        `expected Uint8Array, got ${Object.prototype.toString.call(result)}`
      );
      assert.ok(!(result instanceof Buffer), 'Uint8Array reply must not be a Buffer instance');
      assert.deepEqual(result, new Uint8Array(Buffer.from('hello')));
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
