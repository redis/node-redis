import assert from 'node:assert';
import RedisCommandsQueue from './commands-queue';
import { CommandTimeoutDuringMaintenanceError, TimeoutError } from '../errors';
import { useFakeTimers } from 'sinon';

describe('RedisCommandsQueue', () => {
  function createQueue() {
    return new RedisCommandsQueue(3, null, () => {}, 'test-client');
  }

  function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  describe('timeout', () => {
    function track(promise: Promise<unknown>) {
      const state: { status: 'pending' | 'resolved' | 'rejected', value?: unknown, error?: Error } = { status: 'pending' };
      promise.then(
        value => Object.assign(state, { status: 'resolved', value }),
        error => Object.assign(state, { status: 'rejected', error })
      );
      return state;
    }

    function drain(queue: RedisCommandsQueue) {
      return [...queue.commandsToWrite()].map(chunks => chunks.join('')).join('');
    }

    function assertRejected(state: ReturnType<typeof track>, type: new (...args: never[]) => Error) {
      assert.strictEqual(state.status, 'rejected');
      assert.strictEqual(state.error?.constructor, type);
    }

    const GET_B = '*2\r\n$3\r\nGET\r\n$1\r\nb\r\n';

    it('rejects a command that is not written in time, and never writes it', async () => {
      const queue = createQueue();
      const a = track(queue.addCommand(['GET', 'a'], { timeout: 20 }));

      await wait(40);
      assertRejected(a, TimeoutError);
      assert.strictEqual(drain(queue), '');
    });

    it('stops the deadline timers once no command is left', () => {
      const clock = useFakeTimers();
      try {
        const queue = createQueue();
        queue.addCommand(['GET', 'a'], { timeout: 1000 });
        queue.clearDeadlinesIfEmpty();
        assert.strictEqual(clock.countTimers(), 1);

        drain(queue);
        queue.decoder.write(Buffer.from('$1\r\n1\r\n'));
        // The timer outlives the timeout it was armed for.
        assert.strictEqual(clock.countTimers(), 1);
        queue.clearDeadlinesIfEmpty();
        assert.strictEqual(clock.countTimers(), 0);
      } finally {
        clock.uninstall();
      }
    });

    it('stops once the command is written', async () => {
      const queue = createQueue();
      const a = track(queue.addCommand(['GET', 'a'], { timeout: 20 }));
      drain(queue);

      await wait(40);
      assert.strictEqual(a.status, 'pending');
      queue.decoder.write(Buffer.from('$1\r\n1\r\n'));
      await wait(0);
      assert.deepStrictEqual(a, { status: 'resolved', value: '1' });
    });

    it('times out each timeout value in its own order', async () => {
      const queue = createQueue();
      const a = track(queue.addCommand(['GET', 'a'], { timeout: 80 }));
      const b = track(queue.addCommand(['GET', 'b'], { timeout: 20 }));
      const c = track(queue.addCommand(['GET', 'c'], { timeout: 80 }));
      const d = track(queue.addCommand(['GET', 'd'], { timeout: 20 }));

      await wait(50);
      assertRejected(b, TimeoutError);
      assertRejected(d, TimeoutError);
      assert.strictEqual(a.status, 'pending');
      assert.strictEqual(c.status, 'pending');

      await wait(60);
      assertRejected(a, TimeoutError);
      assertRejected(c, TimeoutError);
      assert.strictEqual(drain(queue), '');
    });

    it('times out a command queued behind commands that were written', async () => {
      const queue = createQueue();
      const a = track(queue.addCommand(['GET', 'a'], { timeout: 30 }));
      drain(queue);
      const b = track(queue.addCommand(['GET', 'b'], { timeout: 30 }));

      await wait(60);
      assert.strictEqual(a.status, 'pending');
      assertRejected(b, TimeoutError);
      assert.strictEqual(drain(queue), '');
    });

    it('times out again after every deadline passed', async () => {
      const queue = createQueue();
      const a = track(queue.addCommand(['GET', 'a'], { timeout: 20 }));
      await wait(40);
      assertRejected(a, TimeoutError);

      const b = track(queue.addCommand(['GET', 'b'], { timeout: 20 }));
      await wait(40);
      assertRejected(b, TimeoutError);
      assert.strictEqual(drain(queue), '');
    });

    it('times out a new command after flushAll', async () => {
      const queue = createQueue();
      const a = track(queue.addCommand(['GET', 'a'], { timeout: 20 }));
      queue.flushAll(new Error('closed'));
      const b = track(queue.addCommand(['GET', 'b'], { timeout: 20 }));

      await wait(40);
      assert.strictEqual(a.error?.message, 'closed');
      assertRejected(b, TimeoutError);
    });

    it('keeps the queue whole when a command with a timeout fails to encode', async () => {
      const queue = createQueue();
      const a = track(queue.addCommand(['GET', {} as never], { timeout: 20 }));
      drain(queue);
      await wait(0);
      const encodeError = a.error;
      assert.ok(encodeError !== undefined && !(encodeError instanceof TimeoutError));

      const b = track(queue.addCommand(['GET', 'b'], { timeout: 60 }));
      await wait(40);
      assert.strictEqual(a.error, encodeError);
      assert.strictEqual(b.status, 'pending');
      assert.strictEqual(drain(queue), GET_B);
    });

    it('ignores the old deadline after a maintenance relax to the same value', async () => {
      const queue = createQueue();
      const a = track(queue.addCommand(['GET', 'a'], { timeout: 40 }));
      await wait(20);
      queue.setMaintenanceCommandTimeout(40);

      await wait(35);
      assert.strictEqual(a.status, 'pending');
      await wait(40);
      assertRejected(a, CommandTimeoutDuringMaintenanceError);
    });

    it('keeps the older deadline of a command moved from another queue', async () => {
      const source = createQueue();
      const destination = createQueue();
      const a = track(source.addCommand(['GET', 'a'], { timeout: 60 }));
      await wait(30);
      const b = track(destination.addCommand(['GET', 'b'], { timeout: 60 }));
      destination.prependCommandsToWrite(source.extractAllCommands());

      await wait(45);
      assertRejected(a, TimeoutError);
      assert.strictEqual(b.status, 'pending');
      assert.strictEqual(drain(source), '');
      assert.strictEqual(drain(destination), GET_B);
    });
  });

  describe('prependCommandsToWrite', () => {
    it('merges the moved deadlines with older ones, and times out each in deadline order', async () => {
      const source = createQueue();
      const destination = createQueue();
      const order: string[] = [];
      const add = (queue: RedisCommandsQueue, name: string) =>
        queue.addCommand(['GET', name], { timeout: 30, slotNumber: 1 }).catch(() => order.push(name));
      add(destination, 'd1');
      add(source, 's1');
      await wait(5);
      add(destination, 'd2');
      add(source, 's2');
      await wait(5);
      add(source, 's3');

      const moved = source.extractCommandsForSlots(new Set([1]));
      assert.strictEqual(moved.length, 3);
      destination.prependCommandsToWrite(moved);
      await wait(60);
      assert.deepStrictEqual(order, ['d1', 's1', 'd2', 's2', 's3']);
    });
  });
});
