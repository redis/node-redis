import { strict as assert } from 'node:assert';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import testUtils from '../test-utils';
import { createMultiDbClient } from '.';
import type { MultiDbController } from './controller';
import type { AnyRedisClientType } from '.';
import type { RedisServerDocker } from '@redis/test-utils';

const execFileAsync = promisify(execFile);

const FORCED = {
  gracePeriod: 1500,
  healthCheck: { interval: 400, timeout: 300, numProbes: 2, delayBetweenProbes: 50 },
  failureDetector: { minNumOfFailures: 3, failureRateThreshold: 0, windowSize: 5000 },
  maxFailoverAttempts: 10,
  delayBetweenFailoverAttempts: 300
};

describe('multi-db forced failover', function () {
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

  it('forces a healthy standby and the pin holds against auto-fallback until released', async () => {
    const { client, controller } = createMultiDbClient({
      ...FORCED,
      autoFallbackInterval: 300,
      databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })]
    });
    await client.connect();
    controller.on('error', () => {});
    try {
      const forced = once<{ from: string; to: string; reason: string }>(controller, 'failover');
      await controller.setActiveDatabase('db-1');
      assert.deepEqual(await forced, { from: 'db-0', to: 'db-1', reason: 'forced' });
      assert.equal(controller.getActiveDatabase().id, 'db-1');

      // several fallback ticks pass; the higher-weight healthy member must not take over
      await new Promise(resolve => setTimeout(resolve, 1000));
      assert.equal(controller.getActiveDatabase().id, 'db-1');

      const fallback = once<{ from: string; to: string }>(controller, 'fallback');
      controller.releasePin();
      assert.deepEqual(await fallback, { from: 'db-1', to: 'db-0' });
      assert.equal(await client.ping(), 'PONG');
    } finally {
      client.destroy();
    }
  });

  it('rejects forcing a target that fails its health check', async () => {
    const { client, controller } = createMultiDbClient({
      ...FORCED,
      databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })]
    });
    await client.connect();
    controller.on('error', () => {});
    try {
      await kill(serverB);
      await assert.rejects(controller.setActiveDatabase('db-1'), /failed its health check/);
      assert.equal(controller.getActiveDatabase().id, 'db-0');
      await assert.rejects(controller.setActiveDatabase('nope'), TypeError);
    } finally {
      client.destroy();
    }
  });

  it('automatic failover moves off a dead pinned member and clears the pin', async () => {
    const { client, controller } = createMultiDbClient({
      ...FORCED,
      autoFallbackInterval: 300,
      databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })]
    });
    await client.connect();
    controller.on('error', () => {});
    try {
      await controller.setActiveDatabase('db-1');

      const failover = once<{ from: string; to: string; reason: string }>(controller, 'failover');
      await kill(serverB);
      assert.equal((await failover).to, 'db-0');
      assert.equal(controller.getActiveDatabase().id, 'db-0');

      // prove the pin is gone: once db-1 recovers and outweighs the active
      // member, the fallback loop (suspended while pinned) must switch again
      const recovered = once(controller, 'database-recovered');
      await start(serverB);
      await recovered;
      controller.setWeight('db-0', 0.2);

      const fallback = once<{ from: string; to: string }>(controller, 'fallback');
      assert.deepEqual(await fallback, { from: 'db-0', to: 'db-1' });
    } finally {
      client.destroy();
    }
  });

  it('forcing the current active pins without a switch', async () => {
    const { client, controller } = createMultiDbClient({
      ...FORCED,
      databases: [memberOf(serverA), memberOf(serverB)]
    });
    await client.connect();
    controller.on('error', () => {});
    try {
      const failovers: Array<unknown> = [];
      controller.on('failover', event => {
        failovers.push(event);
      });
      await controller.setActiveDatabase('db-0');
      assert.equal(controller.getActiveDatabase().id, 'db-0');
      assert.deepEqual(failovers, []);
    } finally {
      client.destroy();
    }
  });

  it('a successful force rescues a client searching with every member down', async () => {
    const { client, controller } = createMultiDbClient({
      ...FORCED,
      databases: [memberOf(serverA), memberOf(serverB)]
    });
    await client.connect();
    controller.on('error', () => {});
    try {
      const searching = once(controller, 'all-databases-down');
      await Promise.all([kill(serverA), kill(serverB)]);
      await searching;

      await start(serverB);
      // wait for the server to accept connections again, then force it
      const deadline = Date.now() + 10_000;
      for (;;) {
        try {
          await controller.setActiveDatabase('db-1');
          break;
        } catch (err) {
          if (Date.now() > deadline) throw err;
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      assert.equal(controller.getActiveDatabase().id, 'db-1');
      assert.equal(await client.ping(), 'PONG');
    } finally {
      client.destroy();
    }
  });
});
