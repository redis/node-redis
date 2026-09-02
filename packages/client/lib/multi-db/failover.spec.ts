import { strict as assert } from 'node:assert';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import testUtils from '../test-utils';
import { createMultiDbClient } from '.';
import type { MultiDbController } from './controller';
import type { AnyRedisClientType } from '.';
import RedisClient from '../client';
import { TemporarilyUnavailableError, PermanentlyUnavailableError } from './errors';
import type { RedisServerDocker } from '@redis/test-utils';

const execFileAsync = promisify(execFile);

// count-only detection: 3 failures within the window trip the detector no
// matter how many successes preceded them (a rate threshold would be diluted
// by pre-failure traffic still inside the window)
const FAST_FAILOVER = {
  failureDetector: { minNumOfFailures: 3, failureRateThreshold: 0, windowSize: 5000 },
  healthCheck: { interval: 3000, timeout: 1000, numProbes: 1, delayBetweenProbes: 0 },
  maxFailoverAttempts: 2,
  delayBetweenFailoverAttempts: 200
};

describe('multi-db failover', function () {
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
    // revive whatever the test killed so the shared servers serve the next one
    await Promise.all(
      [serverA, serverB].map(server =>
        execFileAsync('docker', ['start', server.dockerId]).catch(() => {})
      )
    );
  });

  function kill(server: RedisServerDocker) {
    return execFileAsync('docker', ['kill', server.dockerId]);
  }

  /** issue a command every `intervalMs`, collecting outcomes without ever throwing */
  function startTraffic(client: AnyRedisClientType, intervalMs = 50) {
    const errors: Array<Error> = [];
    let successes = 0;
    const timer = setInterval(() => {
      try {
        (client as { incr(key: string): Promise<number> }).incr('traffic').then(
          () => successes++,
          (err: Error) => errors.push(err)
        );
      } catch (err) {
        errors.push(err as Error);
      }
    }, intervalMs);
    return { errors, successes: () => successes, stop: () => clearInterval(timer) };
  }

  function once<T>(controller: MultiDbController<AnyRedisClientType>, event: never, timeoutMs = 15_000): Promise<T> {
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

  it('kills the active member: failover event fires and traffic continues', async () => {
    const { client, controller } = createMultiDbClient({
      ...FAST_FAILOVER,
      databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })]
    });
    await client.connect();
    const traffic = startTraffic(client);
    try {
      assert.equal(controller.getActiveDatabase().id, 'db-0');

      // definitely in-flight when the server dies — must be rejected (never silently dropped)
      const inFlight = client.blPop('no-such-key', 3);
      inFlight.catch(() => {});

      const failover = once<{ from: string; to: string; reason: string }>(controller, 'failover' as never);
      await kill(serverA);

      assert.deepEqual(await failover, { from: 'db-0', to: 'db-1', reason: 'failure-detector' });
      await assert.rejects(inFlight);

      await client.set('after-failover', 'served');
      const direct = RedisClient.create({ socket: { host: '127.0.0.1', port: serverB.port } });
      await direct.connect();
      try {
        assert.equal(await direct.get('after-failover'), 'served');
      } finally {
        direct.destroy();
      }

      assert.equal(controller.getActiveDatabase().id, 'db-1');
      assert.equal(controller.getDatabases()[0].circuitState, 'OPEN');
    } finally {
      traffic.stop();
      client.destroy();
    }
  });

  it('moves pub/sub subscriptions to the new active member', async () => {
    const { client, controller } = createMultiDbClient({
      ...FAST_FAILOVER,
      databases: [memberOf(serverA), memberOf(serverB)]
    });
    await client.connect();
    const traffic = startTraffic(client);
    const publisher = RedisClient.create({ socket: { host: '127.0.0.1', port: serverB.port } });
    await publisher.connect();
    try {
      const received: Array<string> = [];
      await client.subscribe('news', message => {
        received.push(message);
      });

      const failover = once(controller, 'failover' as never);
      await kill(serverA);
      await failover;

      // the re-subscribe on the new member races the switch: publish until heard
      const deadline = Date.now() + 10_000;
      while (received.length === 0 && Date.now() < deadline) {
        await publisher.publish('news', 'delivered');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      assert.ok(received.includes('delivered'), 'subscription must be live on the new active member');
    } finally {
      traffic.stop();
      publisher.destroy();
      client.destroy();
    }
  });

  it('client-side caching serves no stale reads across a switch, without a flush', async () => {
    const withCache = (server: RedisServerDocker) => ({
      options: {
        socket: { host: '127.0.0.1', port: server.port },
        clientSideCache: { maxEntries: 100, ttl: 0 }
      }
    });
    const direct = RedisClient.create({ socket: { host: '127.0.0.1', port: serverB.port } });
    await direct.connect();
    const { client, controller } = createMultiDbClient({
      ...FAST_FAILOVER,
      databases: [withCache(serverA), withCache(serverB)]
    });
    await client.connect();
    controller.on('error', () => {});
    const traffic = startTraffic(client);
    try {
      await direct.set('cached-key', 'value-on-b');
      await client.set('cached-key', 'value-on-a');
      // two reads: the second is served from the old member's local cache
      assert.equal(await client.get('cached-key'), 'value-on-a');
      assert.equal(await client.get('cached-key'), 'value-on-a');

      const failover = once(controller, 'failover' as never);
      await kill(serverA);
      await failover;

      // caches are per member: the new active answers with its own value
      assert.equal(await client.get('cached-key'), 'value-on-b');
    } finally {
      traffic.stop();
      direct.destroy();
      client.destroy();
    }
  });

  it('escalates to permanently unavailable when every member is down', async () => {
    const { client, controller } = createMultiDbClient({
      ...FAST_FAILOVER,
      databases: [memberOf(serverA), memberOf(serverB)]
    });
    await client.connect();
    controller.on('error', () => {
      // background housekeeping may report the dying members; irrelevant here
    });
    const attempts: Array<{ attempt: number; maxAttempts: number }> = [];
    controller.on('all-databases-down', event => {
      attempts.push(event);
    });
    const traffic = startTraffic(client);
    try {
      await Promise.all([kill(serverA), kill(serverB)]);

      // detector trips A → switch to B (still CLOSED) → B trips → search → exhaust
      const deadline = Date.now() + 20_000;
      while (attempts.length < 2 && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      assert.deepEqual(attempts, [
        { attempt: 1, maxAttempts: 2 },
        { attempt: 2, maxAttempts: 2 }
      ]);

      // the searching window rejects with the temporary error, exhaustion with the permanent one
      await new Promise(resolve => setTimeout(resolve, 300));
      assert.throws(() => (client as { get(key: string): unknown }).get('x'), PermanentlyUnavailableError);
      assert.ok(
        traffic.errors.some(err => err instanceof TemporarilyUnavailableError),
        'commands during the search window must fail fast with TemporarilyUnavailableError'
      );
    } finally {
      traffic.stop();
      client.destroy();
    }
  });
});
