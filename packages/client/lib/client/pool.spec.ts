import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { RESP_TYPES } from '../RESP/decoder';
import { RedisClientPool } from './pool';
import { TimeoutError } from '../errors';

describe('RedisClientPool', () => {
  it('chained withCommandOptions(...).withTypeMapping(...) preserves earlier overrides at dispatch', () => {
    // Regression: pool's `_commandOptionsProxy` had two related bugs.
    // First, it built `_commandOptions` via `Object.create(...)`, leaving earlier
    // keys on the prototype where the dispatch-time spread silently dropped them.
    // Second, `withTypeMapping`/`withAbortSignal`/`asap` called the helper via
    // `this._self.#commandOptionsProxy(...)`, so even the prototype chain was
    // discarded — the helper saw the original pool's `_commandOptions`, not the
    // prior proxy's.
    const pool = RedisClientPool.create({});
    const proxy = pool
      .withCommandOptions({ asap: true })
      .withTypeMapping({ [RESP_TYPES.SIMPLE_STRING]: Buffer });
    type WithOptions = { _commandOptions?: { asap?: boolean; typeMapping?: unknown } };
    const ownKeys = { ...(proxy as unknown as WithOptions)._commandOptions };
    assert.equal(ownKeys.asap, true);
    assert.deepEqual(ownKeys.typeMapping, { [RESP_TYPES.SIMPLE_STRING]: Buffer });
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

  it('close resolves when the last pending connect fails', async () => {
    // Regression: on a failed connect `#create()` removed the client from `#clientsInUse`
    // directly instead of going through `#returnClient()`, the only place that resolves the
    // drain promise. `#clientsInUse` reached 0 without waking `close()`, which hung forever.
    // Nothing listens on port 1 here, so the connect always fails.
    const pool = RedisClientPool.create(
      { socket: { host: '127.0.0.1', port: 1, reconnectStrategy: false } },
      { minimum: 1, maximum: 1, acquireTimeout: 500 }
    );

    const connectPromise = pool.connect();
    assert.equal(pool.clientsInUse, 1, 'a connecting client should count as in use');

    const closePromise = pool.close().then(() => 'closed');
    const hangGuard = new Promise<string>(resolve => {
      setTimeout(resolve, 1000, 'hung').unref();
    });

    await assert.rejects(connectPromise);
    assert.equal(await Promise.race([closePromise, hangGuard]), 'closed');
  });

  it('close rejects the tasks it can no longer serve when the connect fails', async () => {
    // A task queued behind the pending connect is the one thing `close()` is still waiting
    // for. Once that connect fails there is no client left to run it on, so it has to be
    // settled with the connection error rather than left sitting until `acquireTimeout`.
    const acquireTimeout = 200;
    const pool = RedisClientPool.create(
      { socket: { host: '127.0.0.1', port: 1, reconnectStrategy: false } },
      { minimum: 1, maximum: 1, acquireTimeout }
    );

    const connectPromise = pool.connect();
    const connectRejects = assert.rejects(connectPromise);
    const taskRejects = assert.rejects(pool.execute(() => 'never runs'), /ECONNREFUSED/);
    assert.equal(pool.tasksQueueLength, 1, 'the task should be waiting for the connecting client');
    assert.equal(pool.clientsInUse, 1, 'the connecting client should count as in use');

    const closePromise = pool.close().then(() => 'closed');
    const hangGuard = new Promise<string>(resolve => {
      setTimeout(resolve, 1000, 'hung').unref();
    });

    await connectRejects;
    await taskRejects;
    assert.equal(await Promise.race([closePromise, hangGuard]), 'closed');
    assert.equal(pool.tasksQueueLength, 0);

    // The task's acquire timer has to be cleared along with it, otherwise it fires on a node
    // that is already out of the queue and `remove()` throws where nobody can catch it.
    await new Promise(resolve => setTimeout(resolve, acquireTimeout + 50));
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

  testUtils.testWithClientPool(
    'rejects with TimeoutError when acquireTimeout expires',
    async (pool) => {
      const longRunningTask = pool.execute(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      await assert.rejects(
        pool.execute(async () => {}),
        (err: unknown) => {
          assert(err instanceof TimeoutError);
          assert.equal(err.message, 'Timeout waiting for a client after 50ms');
          return true;
        }
      );

      await longRunningTask;
    },
    {
      ...GLOBAL.SERVERS.OPEN,
      poolOptions: { minimum: 1, maximum: 1, acquireTimeout: 50 },
    }
  );

  it('scale-up connect failure rejects the waiting task with the real error, not TimeoutError, and never goes unhandled', async () => {
    // Regression for #3397: execute() fires a fire-and-forget #create() to scale
    // the pool up. When that connect fails, the rejection used to go unhandled and
    // the waiting task was left to hit acquireTimeout (masking the real error) or
    // hang forever when acquireTimeout is 0. The failure must now be routed to the
    // waiting task with the real connect error.
    let unhandled: unknown;
    const onUnhandled = (err: unknown) => { unhandled = err; };
    process.on('unhandledRejection', onUnhandled);

    // minimum: 0 opens the pool with no clients (no server needed); the first
    // task then triggers a scale-up connect against a dead address, which fails
    // fast because reconnectStrategy is disabled. acquireTimeout: 0 means no
    // timer is armed, so an unfixed pool would hang here rather than time out.
    const pool = RedisClientPool.create(
      {
        socket: { host: '127.0.0.1', port: 1, reconnectStrategy: false, connectTimeout: 100 }
      },
      { minimum: 0, maximum: 1, acquireTimeout: 0 }
    );
    pool.on('error', () => {}); // swallow re-emitted client connect errors

    try {
      await pool.connect();

      await assert.rejects(
        pool.execute(async () => { /* never runs */ }),
        (err: unknown) => {
          assert(!(err instanceof TimeoutError), 'must surface the real connect error, not TimeoutError');
          return true;
        }
      );

      // Let any stray unhandled rejection surface before asserting.
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(unhandled, undefined, 'scale-up connect failure must not go unhandled');
    } finally {
      process.removeListener('unhandledRejection', onUnhandled);
      await pool.close().catch(() => {});
    }
  });

  testUtils.testWithClientPool('a synchronous throw from one task does not strand another waiter', async pool => {
    // #3401 review (finding 2): on the scale-up path #create() runs the queued
    // callback after a successful connect. A synchronous throw there used to
    // escape into execute()'s scale-up .catch, which rejected an unrelated
    // waiter and left the throwing task's neighbour stranded. The throw must
    // settle its own task and the client must be returned so the next queued
    // task is served.
    const throwing = pool.execute(() => { throw new Error('boom'); });
    const normal = pool.execute(client => client.sendCommand(['PING']));

    await assert.rejects(throwing, /boom/);
    // Would hang (then TimeoutError) before the fix — must be served instead.
    assert.equal(await normal, 'PONG');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    poolOptions: { minimum: 0, maximum: 1, acquireTimeout: 1000 }
  });
});
