import { strict as assert } from 'node:assert';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import testUtils from '../test-utils';
import { createMultiDbClient } from '.';
import type { MultiDbController } from './controller';
import type { AnyRedisClientType } from '.';
import type { RedisServerDocker } from '@redis/test-utils';

const execFileAsync = promisify(execFile);

const GRACE_PERIOD = 2000;

// short grace + fast probe cadence so recovery completes within seconds;
// count-only detection as in failover.spec.ts
const RECOVERY = {
  gracePeriod: GRACE_PERIOD,
  healthCheck: { interval: 400, timeout: 300, numProbes: 2, delayBetweenProbes: 50 },
  failureDetector: { minNumOfFailures: 3, failureRateThreshold: 0, windowSize: 5000 },
  maxFailoverAttempts: 10,
  delayBetweenFailoverAttempts: 300
};

describe('multi-db recovery and fallback', function () {
  this.timeout(60_000);

  let serverA: RedisServerDocker;
  let serverB: RedisServerDocker;

  const memberOf = (server: RedisServerDocker, extra?: { id?: string; weight?: number }) => ({
    ...extra,
    options: { socket: { host: '127.0.0.1', port: server.port } }
  });

  before(async function () {
    this.timeout(120_000);
    const results = await Promise.allSettled([
      testUtils.spawnRedisServer({ serverArguments: [] }),
      testUtils.spawnRedisServer({ serverArguments: [] })
    ]);
    if (results[0].status === 'fulfilled') serverA = results[0].value;
    if (results[1].status === 'fulfilled') serverB = results[1].value;
    const rejected = results.find(result => result.status === 'rejected');
    if (rejected) throw (rejected as PromiseRejectedResult).reason;
  });

  after(async () => {
    await Promise.all(
      [serverA, serverB]
        .filter(Boolean)
        .map(server => execFileAsync('docker', ['rm', '-f', server.dockerId]))
    );
  });

  afterEach(async () => {
    await Promise.all(
      [serverA, serverB].map(server =>
        execFileAsync('docker', ['start', server.dockerId]).catch(() => {})
      )
    );
  });

  const kill = (server: RedisServerDocker) => execFileAsync('docker', ['kill', server.dockerId]);
  const start = (server: RedisServerDocker) => execFileAsync('docker', ['start', server.dockerId]);

  function once<T>(controller: MultiDbController<AnyRedisClientType>, event: string, timeoutMs = 20_000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`timed out waiting for '${event}' after ${timeoutMs}ms`)),
        timeoutMs
      );
      (controller as { once(event: string, listener: (payload: T) => void): void }).once(event, payload => {
        clearTimeout(timer);
        resolve(payload);
      });
    });
  }

  it('a recovered member closes its circuit after grace + probes, and stays passive by default', async () => {
    const { client, controller } = createMultiDbClient({
      ...RECOVERY,
      databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })]
    });
    await client.connect();
    controller.on('error', () => {});
    try {
      let unhealthyAt = 0;
      let recoveredAt = 0;
      controller.on('database-unhealthy', event => {
        if (event.id === 'db-0' && unhealthyAt === 0) unhealthyAt = Date.now();
      });

      const failover = once(controller, 'failover');
      await kill(serverA);
      await failover;

      const recovered = once<{ id: string }>(controller, 'database-recovered');
      await start(serverA);
      assert.deepEqual(await recovered, { id: 'db-0' });
      recoveredAt = Date.now();

      // no flapping: the member restarted almost immediately, but its circuit
      // must not close before the grace period has run
      assert.ok(unhealthyAt > 0, 'database-unhealthy must fire for the failed member');
      assert.ok(
        recoveredAt - unhealthyAt >= GRACE_PERIOD - 100,
        `recovered after ${recoveredAt - unhealthyAt}ms — before the ${GRACE_PERIOD}ms grace period`
      );

      // auto-fallback is disabled by default: traffic stays on the standby
      assert.equal(controller.getActiveDatabase().id, 'db-1');
      assert.deepEqual(
        controller.getDatabases().map(db => db.circuitState),
        ['CLOSED', 'CLOSED']
      );
      assert.equal(await client.ping(), 'PONG');
    } finally {
      client.destroy();
    }
  });

  it('auto-fallback returns traffic to the recovered higher-weight member', async () => {
    const { client, controller } = createMultiDbClient({
      ...RECOVERY,
      autoFallbackInterval: 500,
      databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })]
    });
    await client.connect();
    controller.on('error', () => {});
    try {
      const failover = once(controller, 'failover');
      await kill(serverA);
      await failover;
      assert.equal(controller.getActiveDatabase().id, 'db-1');

      const fallback = once<{ from: string; to: string }>(controller, 'fallback');
      await start(serverA);
      assert.deepEqual(await fallback, { from: 'db-1', to: 'db-0' });

      assert.equal(controller.getActiveDatabase().id, 'db-0');
      await client.set('after-fallback', 'served');
      assert.equal(await client.get('after-fallback'), 'served');
    } finally {
      client.destroy();
    }
  });

  it('setAutoFallback toggles the loop at runtime', async () => {
    const { client, controller } = createMultiDbClient({
      ...RECOVERY,
      databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })]
    });
    await client.connect();
    controller.on('error', () => {});
    try {
      const failover = once(controller, 'failover');
      await kill(serverA);
      await failover;

      const recovered = once(controller, 'database-recovered');
      await start(serverA);
      await recovered;

      // disabled (the default): the recovered heavier member must not take over
      await new Promise(resolve => setTimeout(resolve, 1200));
      assert.equal(controller.getActiveDatabase().id, 'db-1');

      const fallback = once<{ from: string; to: string }>(controller, 'fallback');
      controller.setAutoFallback(300);
      assert.deepEqual(await fallback, { from: 'db-1', to: 'db-0' });

      controller.setAutoFallback(false);
      assert.throws(() => controller.setAutoFallback(NaN), /autoFallbackInterval/);
    } finally {
      client.destroy();
    }
  });

  it('a failing passive member is reported unhealthy without a failover', async () => {
    const { client, controller } = createMultiDbClient({
      ...RECOVERY,
      databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })]
    });
    await client.connect();
    controller.on('error', () => {});
    try {
      const failovers: Array<unknown> = [];
      controller.on('failover', event => {
        failovers.push(event);
      });

      const unhealthy = once<{ id: string }>(controller, 'database-unhealthy');
      await kill(serverB);
      assert.equal((await unhealthy).id, 'db-1');

      assert.deepEqual(failovers, [], 'a passive failure must not switch the active member');
      assert.equal(controller.getActiveDatabase().id, 'db-0');
      assert.equal(await client.ping(), 'PONG');

      const recovered = once<{ id: string }>(controller, 'database-recovered');
      await start(serverB);
      assert.equal((await recovered).id, 'db-1');
    } finally {
      client.destroy();
    }
  });
});
