import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { RedisClientPool } from './pool';

describe('RedisClientPool', () => {
  it('should not have HOTKEYS commands (requires session affinity)', () => {
    // HOTKEYS commands require session affinity and are only available on standalone clients
    const pool = RedisClientPool.create({});
    assert.equal((pool as any).hotkeysStart, undefined);
    assert.equal((pool as any).hotkeysStop, undefined);
    assert.equal((pool as any).hotkeysGet, undefined);
    assert.equal((pool as any).hotkeysReset, undefined);
    assert.equal((pool as any).HOTKEYS_START, undefined);
    assert.equal((pool as any).HOTKEYS_STOP, undefined);
    assert.equal((pool as any).HOTKEYS_GET, undefined);
    assert.equal((pool as any).HOTKEYS_RESET, undefined);
  });

  testUtils.testWithClientPool('sendCommand', async pool => {
    assert.equal(
      await pool.sendCommand(['PING']),
      'PONG'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool('multi sendCommand', async pool => {
    assert.deepEqual(
      await pool.multi()
        .sendCommand(['SET', 'key', 'value'])
        .sendCommand(['GET', 'key'])
        .exec(),
      ['OK', 'value']
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool('close', async pool => {
    assert.equal(pool.isOpen, true, 'pool should be open before close');
    await pool.close();
    assert.equal(pool.totalClients, 0, 'totalClients should be 0 after close');
    assert.equal(pool.isOpen, false, 'isOpen should be false after close');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool('destroy', async pool => {
    assert.equal(pool.isOpen, true, 'pool should be open before destroy');
    pool.destroy();
    assert.equal(pool.totalClients, 0, 'totalClients should be 0 after destroy');
    assert.equal(pool.isOpen, false, 'isOpen should be false after destroy');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool('close waits for in-flight and queued tasks', async pool => {
    const events: string[] = [];

    // Start a long-running task (will be in-flight)
    const task1Promise = pool.execute(async client => {
      events.push('task1 started');
      await client.set('key1', 'value1');
      await new Promise(resolve => setTimeout(resolve, 100));
      events.push('task1 completed');
      return 'task1';
    });

    // This task will be queued since the pool has only 1 client (minimum: 1, maximum: 1)
    const task2Promise = pool.execute(async client => {
      events.push('task2 started');
      await client.set('key2', 'value2');
      events.push('task2 completed');
      return 'task2';
    });

    // Verify task2 is queued
    assert.equal(pool.tasksQueueLength, 1, 'task2 should be queued');

    // Close while task1 is running and task2 is queued
    await pool.close();
    events.push('close completed');

    // Desired behavior: close() should wait for all tasks to complete
    // - Both in-flight tasks and queued tasks should complete before close() returns
    // - All task promises should be fulfilled (not rejected)
    assert.deepEqual(events, [
      'task1 started',
      'task1 completed',
      'task2 started',
      'task2 completed',
      'close completed'
    ], 'close() should wait for all tasks to complete');

    // Verify both tasks completed successfully
    const [result1, result2] = await Promise.all([task1Promise, task2Promise]);
    assert.equal(result1, 'task1');
    assert.equal(result2, 'task2');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    poolOptions: { minimum: 1, maximum: 1, acquireTimeout: 2000, cleanupDelay: 400  }
  });

  testUtils.testWithClientPool('execute rejects when pool is closing', async pool => {
    // Start a long-running task to keep the pool busy during close
    const task1Promise = pool.execute(async client => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'task1';
    });

    // Start closing (will wait for task1 to complete)
    const closePromise = pool.close();

    // Try to execute a new command while closing
    await assert.rejects(
      pool.execute(client => client.ping()),
      { message: /closed/i },
      'execute() should reject when pool is closing'
    );

    // sendCommand should also reject
    await assert.rejects(
      pool.sendCommand(['PING']),
      { message: /closed/i },
      'sendCommand() should reject when pool is closing'
    );

    // ping() should also reject
    await assert.rejects(
      pool.ping(),
      { message: /closed/i },
      'ping() should reject when pool is closing'
    );

    // multi() should also reject when executed
    await assert.rejects(
      pool.multi().ping().exec(),
      { message: /closed/i },
      'multi().exec() should reject when pool is closing'
    );

    await closePromise;
    await task1Promise;
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool('execute rejects when pool is closed', async pool => {
    await pool.close();

    // Try to execute after pool is closed
    await assert.rejects(
      pool.execute(client => client.ping()),
      { message: /closed/i },
      'execute() should reject when pool is closed'
    );

    // sendCommand should also reject
    await assert.rejects(
      pool.sendCommand(['PING']),
      { message: /closed/i },
      'sendCommand() should reject when pool is closed'
    );

    // ping() should also reject
    await assert.rejects(
      pool.ping(),
      { message: /closed/i },
      'ping() should reject when pool is closed'
    );

    // multi() should also reject when executed
    await assert.rejects(
      pool.multi().ping().exec(),
      { message: /closed/i },
      'multi().exec() should reject when pool is closed'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool('execute rejects when pool is destroyed', async pool => {
    pool.destroy();

    // Try to execute after pool is destroyed
    await assert.rejects(
      pool.execute(client => client.ping()),
      { message: /closed/i },
      'execute() should reject when pool is destroyed'
    );

    // sendCommand should also reject
    await assert.rejects(
      pool.sendCommand(['PING']),
      { message: /closed/i },
      'sendCommand() should reject when pool is destroyed'
    );

    // ping() should also reject
    await assert.rejects(
      pool.ping(),
      { message: /closed/i },
      'ping() should reject when pool is destroyed'
    );

    // multi() should also reject when executed
    await assert.rejects(
      pool.multi().ping().exec(),
      { message: /closed/i },
      'multi().exec() should reject when pool is destroyed'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool(
    'proper error propagation in sequential operations',
    async (pool) => {
      let hasUnhandledRejection = false;

      process.once('unhandledRejection', () => {
        hasUnhandledRejection = true;
      });

      const groupName = 'test-group';
      const streamName = 'test-stream';

      // First attempt - should succeed
      await pool.xGroupCreate(streamName, groupName, '0', {
        MKSTREAM: true,
      });

      // Subsequent attempts - should all throw BUSYGROUP errors and be handled properly
      for (let i = 0; i < 3; i++) {
        await assert.rejects(
          pool.xGroupCreate(streamName, groupName, '0', {
            MKSTREAM: true,
          })
        );
      }

      assert.equal(hasUnhandledRejection, false);
    },
    GLOBAL.SERVERS.OPEN
  );
});
