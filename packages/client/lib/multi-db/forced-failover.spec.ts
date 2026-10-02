import { strict as assert } from 'node:assert';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createMultiDbClient } from '.';
import type { RedisServerDocker } from '@redis/test-utils';
import { once, spawnServerPair, killServer, startServer } from './test-util';

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
    const spawned = await spawnServerPair();
    serverA = spawned.serverA!;
    serverB = spawned.serverB!;
    if (spawned.error) throw spawned.error;
  });

  after(async () => {
    await Promise.all(
      [serverA, serverB]
        .filter(Boolean)
        .map(server => execFileAsync('docker', ['rm', '-f', server.dockerId]))
    );
  });

  afterEach(async () => {
    await Promise.all([serverA, serverB].map(startServer));
  });

  const kill = killServer;
  const start = startServer;

  it('forces a healthy standby and the pin holds against auto-fallback until released', async () => {
    const { client, controller } = createMultiDbClient({
      ...FORCED,
      autoFallbackInterval: 300,
      databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })]
    });
    await client.connect();
    client.on('error', () => {});
    try {
      const forced = once(client, 'failover');
      await controller.setActiveDatabase('db-1');
      assert.deepEqual(await forced, { from: 'db-0', to: 'db-1', reason: 'forced' });
      assert.equal(controller.getActiveDatabase().id, 'db-1');

      // several fallback ticks pass; the higher-weight healthy member must not take over
      await new Promise(resolve => setTimeout(resolve, 1000));
      assert.equal(controller.getActiveDatabase().id, 'db-1');

      const fallback = once(client, 'fallback');
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
    client.on('error', () => {});
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
    client.on('error', () => {});
    try {
      await controller.setActiveDatabase('db-1');

      const failover = once(client, 'failover');
      await kill(serverB);
      assert.equal((await failover).to, 'db-0');
      assert.equal(controller.getActiveDatabase().id, 'db-0');

      // prove the pin is gone: once db-1 recovers and outweighs the active
      // member, the fallback loop (suspended while pinned) must switch again
      const recovered = once(client, 'database-recovered');
      await start(serverB);
      await recovered;
      controller.setWeight('db-0', 0.2);

      const fallback = once(client, 'fallback');
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
    client.on('error', () => {});
    try {
      const failovers: Array<unknown> = [];
      client.on('failover', event => {
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
    client.on('error', () => {});
    try {
      const searching = once(client, 'all-databases-down');
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
