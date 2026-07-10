import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { RESP_TYPES } from '../RESP/decoder';
import { RedisClientPool } from './pool';
import { CommandOptions } from './commands-queue';

type WithCommandOptions = { _commandOptions: CommandOptions };

describe('RedisClientPool', () => {
  it('chained withCommandOptions(...).withTypeMapping(...) preserves earlier overrides at dispatch', () => {
    // Command options layer via the prototype chain and dispatch paths read
    // individual properties, so earlier overrides stay reachable. Also guards
    // the old bug where `withTypeMapping`/`withAbortSignal`/`asap` called the
    // helper via `this._self.#commandOptionsProxy(...)`, discarding the prior
    // proxy's options.
    const pool = RedisClientPool.create({});
    const proxy = pool
      .withCommandOptions({ asap: true })
      .withTypeMapping({ [RESP_TYPES.SIMPLE_STRING]: Buffer });
    type WithOptions = { _commandOptions?: { asap?: boolean; typeMapping?: unknown } };
    const opts = (proxy as unknown as WithOptions)._commandOptions;
    assert.equal(opts?.asap, true);
    assert.deepEqual(opts?.typeMapping, { [RESP_TYPES.SIMPLE_STRING]: Buffer });
  });

  it('initializes _commandOptions from clientOptions.commandOptions', () => {
    // Regression: when constructor commandOptions weren't propagated to the pool's own
    // _commandOptions, the typeMapping equality check in client._executeCommand
    // failed and silently bypassed client-side cache for pools.
    const commandOptions = { typeMapping: {} };
    const pool = RedisClientPool.create({ commandOptions });
    const internal = Object.getPrototypeOf(pool) as { _commandOptions?: typeof commandOptions };
    assert.equal(internal._commandOptions, commandOptions);
  });

  it('should not have HOTKEYS commands (requires session affinity)', () => {
    // HOTKEYS commands require session affinity and are only available on standalone clients
    const pool = RedisClientPool.create({}) as unknown as Record<string, unknown>;
    assert.equal(pool.hotkeysStart, undefined);
    assert.equal(pool.hotkeysStop, undefined);
    assert.equal(pool.hotkeysGet, undefined);
    assert.equal(pool.hotkeysReset, undefined);
    assert.equal(pool.HOTKEYS_START, undefined);
    assert.equal(pool.HOTKEYS_STOP, undefined);
    assert.equal(pool.HOTKEYS_GET, undefined);
    assert.equal(pool.HOTKEYS_RESET, undefined);
  });

  testUtils.testWithClientPool('sendCommand', async pool => {
    assert.equal(
      await pool.sendCommand(['PING']),
      'PONG'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool('withTypeMapping override reaches raw sendCommand', async pool => {
    // Regression for `pool.ts:534-535`: pool.sendCommand now merges its own
    // `_commandOptions` (which a `withCommandOptions` proxy overrides) before
    // dispatching to the leased client.
    const typed = pool.withTypeMapping({
      [RESP_TYPES.SIMPLE_STRING]: Buffer
    });
    const resp = await typed.sendCommand(['PING']);
    assert.deepEqual(resp, Buffer.from('PONG'));
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool('withTypeMapping override reaches typed commands', async pool => {
    const typed = pool.withTypeMapping({
      [RESP_TYPES.SIMPLE_STRING]: Buffer
    });
    const resp = await typed.ping();
    assert.deepEqual(resp, Buffer.from('PONG'));
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool('constructor commandOptions reach sendCommand without an explicit proxy', async pool => {
    // The stated motivation for storing `_commandOptions` on the pool at
    // construction was that the typeMapping needs to reach dispatch — the
    // earlier internal-shape test only proved the property is stored.
    const resp = await pool.sendCommand(['PING']);
    assert.deepEqual(resp, Buffer.from('PONG'));
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      commandOptions: {
        typeMapping: {
          [RESP_TYPES.SIMPLE_STRING]: Buffer
        }
      }
    }
  });

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
    const task1Promise = pool.execute(async _client => {
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

  testUtils.testWithClientPool(' proxy inheritance completes', async pool => {
    const TIMEOUT = 1234;

    (pool as unknown as WithCommandOptions)._commandOptions = { timeout: TIMEOUT };

    const bufferProxy = pool.withCommandOptions({
      typeMapping: {
        [RESP_TYPES.BLOB_STRING]: Buffer
      }
    });

    const stringReply = await pool.sendCommand(['ECHO', 'hello']);
    assert.equal(typeof stringReply, 'string', 'Base pool should return a string');

    const bufferReply = await bufferProxy.sendCommand(['ECHO', 'hello']);
    assert.ok(bufferReply instanceof Buffer, 'Proxy should return a Buffer');
    assert.equal(bufferReply.toString(), 'hello');

    const proxyOptions = (bufferProxy as unknown as WithCommandOptions)._commandOptions;

    assert.equal(
      proxyOptions.timeout,
      TIMEOUT,
      'Proxy should inherit timeout from base pool'
    );

    assert.equal(
      Object.prototype.hasOwnProperty.call(proxyOptions, 'timeout'),
      false,
      'Timeout should be inherited via prototype chain, not copied'
    );

    assert.equal(
      Object.prototype.hasOwnProperty.call(proxyOptions, 'typeMapping'),
      true,
      'TypeMapping should be a direct property of the proxy options'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool('nested proxy inheritance', async pool => {
    const TIMEOUT = 1234;

    const timeoutProxy = pool.withCommandOptions({
      timeout: TIMEOUT
    });

    const chainedProxy = timeoutProxy.withTypeMapping({
      [RESP_TYPES.BLOB_STRING]: Buffer
    });

    const chainedReply = await chainedProxy.sendCommand(['ECHO', 'hello']);

    assert.ok(chainedReply instanceof Buffer);
    assert.equal(chainedReply.toString(), 'hello');

    const chainedOptions = (chainedProxy as unknown as WithCommandOptions)._commandOptions;

    assert.equal(chainedOptions.timeout, TIMEOUT);
    assert.equal(
      Object.prototype.hasOwnProperty.call(chainedOptions, 'timeout'),
      false
    );

    assert.equal(
      Object.prototype.hasOwnProperty.call(chainedOptions, 'typeMapping'),
      true
    );
  }, GLOBAL.SERVERS.OPEN)

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
