import { strict as assert } from 'node:assert';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import testUtils from '../test-utils';
import { createMultiDbClient } from '.';
import type { AnyRedisClientType } from '.';
import RedisClient from '../client';
import { TemporarilyUnavailableError, PermanentlyUnavailableError } from './errors';
import type { RedisServerDocker } from '@redis/test-utils';
import type { CommandParser } from '../client/parser';

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

  function once<T>(emitter: unknown, event: never, timeoutMs = 15_000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`timed out waiting for '${event}' after ${timeoutMs}ms`)),
        timeoutMs
      );
      (emitter as { once(event: string, listener: (payload: T) => void): void }).once(event, payload => {
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

      const failover = once<{ from: string; to: string; reason: string }>(client, 'failover' as never);
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
    const { client } = createMultiDbClient({
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

      const failover = once(client, 'failover' as never);
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

  it('a RESP2 member serves commands again after its subscriptions move away', async () => {
    const { client, controller } = createMultiDbClient<{}, {}, {}, 2>({
      ...FAST_FAILOVER,
      databases: [
        { weight: 1, options: { RESP: 2, socket: { host: '127.0.0.1', port: serverA.port } } },
        { weight: 0.5, options: { RESP: 2, socket: { host: '127.0.0.1', port: serverB.port } } }
      ]
    });
    await client.connect();
    client.on('error', () => {});
    // a RESP2 subscriber-mode connection cannot publish — use a direct client
    const publisher = RedisClient.create({ socket: { host: '127.0.0.1', port: serverB.port } });
    await publisher.connect();
    try {
      const received: Array<string> = [];
      await client.subscribe('news', message => {
        received.push(String(message));
      });

      await controller.setActiveDatabase('db-1');
      // the move is asynchronous: wait until the subscription serves on db-1
      const deadline = Date.now() + 10_000;
      while (received.length === 0 && Date.now() < deadline) {
        await publisher.publish('news', 'delivered');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      assert.ok(received.length > 0, 'subscription must be live on the new active member');

      // drop the subscription on the active member, then return to db-0: its
      // main connection must have left server-side subscriber mode at the move
      await client.unsubscribe('news');
      await controller.setActiveDatabase('db-0');

      await client.set('resp2-back', 'ok');
      assert.equal(await client.get('resp2-back'), 'ok');
    } finally {
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
    const { client } = createMultiDbClient({
      ...FAST_FAILOVER,
      databases: [withCache(serverA), withCache(serverB)]
    });
    await client.connect();
    client.on('error', () => {});
    const traffic = startTraffic(client);
    try {
      await direct.set('cached-key', 'value-on-b');
      await client.set('cached-key', 'value-on-a');
      // two reads: the second is served from the old member's local cache
      assert.equal(await client.get('cached-key'), 'value-on-a');
      assert.equal(await client.get('cached-key'), 'value-on-a');

      const failover = once(client, 'failover' as never);
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
    const { client } = createMultiDbClient({
      ...FAST_FAILOVER,
      databases: [memberOf(serverA), memberOf(serverB)]
    });
    await client.connect();
    client.on('error', () => {
      // background housekeeping may report the dying members; irrelevant here
    });
    const attempts: Array<{ attempt: number; maxAttempts: number }> = [];
    client.on('all-databases-down', event => {
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
      await assert.rejects(
        (client as { get(key: string): Promise<unknown> }).get('x'),
        PermanentlyUnavailableError
      );
      // multi() stays creation-safe: the builder works, the rejection surfaces at exec
      const tx = (client as { multi(): { exec(): Promise<unknown> } }).multi();
      await assert.rejects(tx.exec(), PermanentlyUnavailableError);
      // pinned sync surfaces still throw at creation
      assert.throws(() => (client as { scanIterator(): unknown }).scanIterator(), PermanentlyUnavailableError);
      assert.ok(
        traffic.errors.some(err => err instanceof TemporarilyUnavailableError),
        'commands during the search window must fail fast with TemporarilyUnavailableError'
      );
    } finally {
      traffic.stop();
      client.destroy();
    }
  });

  it('background errors without an error listener do not crash the process', async () => {
    const { client } = createMultiDbClient({
      ...FAST_FAILOVER,
      databases: [memberOf(serverA), memberOf(serverB)]
    });
    await client.connect();
    // outside a test runner an unhandled rejection kills the process; capture
    // it here so the crash is assertable instead of runner-dependent
    const rejections: Array<unknown> = [];
    const onRejection = (err: unknown) => rejections.push(err);
    process.on('unhandledRejection', onRejection);
    // deliberately NO client.on('error', ...): the guarded emit must drop
    // the background error instead of throwing inside a promise handler
    const unhealthy = once<{ id: string }>(client, 'database-unhealthy' as never);
    client.on('database-unhealthy', () => {
      throw new Error('listener explosion');
    });
    try {
      await kill(serverB); // passive member: only the background check sees it
      assert.equal((await unhealthy).id, 'db-1');
      // give the interval's promise chain a beat to surface the rejection
      await new Promise(resolve => setTimeout(resolve, 500));
      assert.deepEqual(rejections, []);
      assert.equal(await (client as { ping(): Promise<string> }).ping(), 'PONG');
    } finally {
      process.off('unhandledRejection', onRejection);
      client.destroy();
    }
  });

  it('namespace command failures alone trip the detector; while every member is down namespace calls reject', async function () {
    this.timeout(90_000);
    const nsModule = {
      bump: {
        parseCommand(parser: CommandParser, key: string) {
          parser.push('INCR', key);
        },
        transformReply: undefined as unknown as () => unknown
      },
      // fails server-side on a healthy connection: the only detector feed is
      // the command outcome itself, never socket noise
      boom: {
        parseCommand(parser: CommandParser) {
          parser.push('NOSUCHCOMMAND');
        },
        transformReply: undefined as unknown as () => unknown
      }
    };
    const memberWithModule = (server: RedisServerDocker, extra?: { weight?: number }) => ({
      ...extra,
      options: {
        socket: { host: '127.0.0.1', port: server.port },
        modules: { mymod: nsModule }
      }
    });
    const { client, controller } = createMultiDbClient({
      ...FAST_FAILOVER,
      // health checks slow enough that only the detector can drive the failover
      healthCheck: { interval: 30_000, timeout: 1_000, numProbes: 1, delayBetweenProbes: 0 },
      databases: [memberWithModule(serverA, { weight: 1 }), memberWithModule(serverB, { weight: 0.5 })]
    });
    await client.connect();
    client.on('error', () => {});
    const failovers: Array<unknown> = [];
    client.on('failover', event => failovers.push(event));
    const attempts: Array<unknown> = [];
    client.on('all-databases-down', event => attempts.push(event));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- module surface is untyped on the generic wrapper
    const ns = (client as any).mymod;
    try {
      await ns.bump('mymod-traffic'); // sanity: the namespace serves

      // detector: minNumOfFailures 3, rate 0 — three failed outcomes must trip it
      for (let i = 0; i < 3; i++) {
        await ns.boom().catch(() => {});
      }
      assert.deepEqual(
        failovers,
        [{ from: 'db-0', to: 'db-1', reason: 'failure-detector' }],
        'namespace outcomes alone must drive the failover'
      );
      assert.equal(controller.getActiveDatabase().id, 'db-1');

      // while every member is down, namespace calls reject like plain commands
      await Promise.all([kill(serverA), kill(serverB)]);
      const exhausted = Date.now() + 20_000;
      while (attempts.length < 2 && Date.now() < exhausted) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      await assert.rejects(ns.bump('mymod-x'), PermanentlyUnavailableError);
    } finally {
      client.destroy();
    }
  });

  it('view command failures alone trip the detector; while every member is down view calls reject', async function () {
    this.timeout(90_000);
    const { client, controller } = createMultiDbClient({
      ...FAST_FAILOVER,
      // health checks slow enough that only the detector can drive the failover
      healthCheck: { interval: 30_000, timeout: 1_000, numProbes: 1, delayBetweenProbes: 0 },
      databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })]
    });
    await client.connect();
    client.on('error', () => {});
    const failovers: Array<unknown> = [];
    client.on('failover', event => failovers.push(event));
    const attempts: Array<unknown> = [];
    client.on('all-databases-down', event => attempts.push(event));
    const view = client.withTypeMapping({});
    try {
      assert.equal(await view.ping(), 'PONG');

      // server-side failures on a healthy connection: only view outcomes can trip it
      for (let i = 0; i < 3; i++) {
        await view.sendCommand(['NOSUCHCOMMAND']).catch(() => {});
      }
      assert.deepEqual(
        failovers,
        [{ from: 'db-0', to: 'db-1', reason: 'failure-detector' }],
        'view outcomes alone must drive the failover'
      );
      assert.equal(controller.getActiveDatabase().id, 'db-1');

      await Promise.all([kill(serverA), kill(serverB)]);
      const exhausted = Date.now() + 20_000;
      while (attempts.length < 2 && Date.now() < exhausted) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      await assert.rejects(view.get('view-x'), PermanentlyUnavailableError);
    } finally {
      client.destroy();
    }
  });

  it('the wrapper is the event surface: lifecycle, member events, registration during outage', async function () {
    this.timeout(90_000);
    const { client, controller } = createMultiDbClient({
      ...FAST_FAILOVER,
      databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })]
    });
    const events: Array<{ event: string; payload?: unknown }> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- multi-db events are untyped on the generic wrapper
    const emitter = client as any;
    for (const name of ['ready', 'failover', 'member-error', 'terminated']) {
      emitter.on(name, (payload: unknown) => events.push({ event: name, payload }));
    }
    emitter.on('error', () => {});
    await client.connect();
    assert.ok(events.some(e => e.event === 'ready'), 'connect() must announce readiness on the wrapper');
    // the controller is a pure admin handle
    assert.equal(emitter === controller, false);
    assert.equal((controller as { on?: unknown }).on, undefined, 'the controller must expose no event surface');
    try {
      await kill(serverA);
      const deadline = Date.now() + 10_000;
      while (!events.some(e => e.event === 'failover') && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      const failover = events.find(e => e.event === 'failover');
      assert.deepEqual(failover?.payload, { from: 'db-0', to: 'db-1', reason: 'failure-detector' });
      assert.ok(
        events.some(e => e.event === 'member-error' && (e.payload as { id?: string }).id === 'db-0'),
        'member-error must carry the member id in the payload'
      );

      await kill(serverB);
      // registration and removal must work while every member is down
      const noop = () => {};
      emitter.on('ready', noop);
      emitter.off('ready', noop);

      const exhausted = Date.now() + 20_000;
      while (!events.some(e => e.event === 'terminated') && Date.now() < exhausted) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      const terminated = events.find(e => e.event === 'terminated');
      assert.deepEqual(terminated?.payload, { attempts: 2 }, 'terminated must report the exhausted attempts');
    } finally {
      client.destroy();
    }
  });

  it('a repeat connect() recovers a permanently unavailable client', async function () {
    this.timeout(90_000);
    const { client, controller } = createMultiDbClient({
      ...FAST_FAILOVER,
      databases: [memberOf(serverA), memberOf(serverB)]
    });
    await client.connect();
    client.on('error', () => {});
    const attempts: Array<unknown> = [];
    client.on('all-databases-down', event => attempts.push(event));
    const traffic = startTraffic(client);
    try {
      await Promise.all([kill(serverA), kill(serverB)]);

      const deadline = Date.now() + 20_000;
      while (attempts.length < 2 && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      await assert.rejects(
        (client as { get(key: string): Promise<unknown> }).get('x'),
        PermanentlyUnavailableError
      );
      // multi() stays creation-safe; the rejection surfaces at exec
      await assert.rejects(
        (client as { multi(): { exec(): Promise<unknown> } }).multi().exec(),
        PermanentlyUnavailableError
      );
      traffic.stop();

      // both members return; wait until they accept connections again
      await Promise.all([serverA, serverB].map(server =>
        execFileAsync('docker', ['start', server.dockerId])
      ));
      for (const server of [serverA, serverB]) {
        const probeDeadline = Date.now() + 15_000;
        while (Date.now() < probeDeadline) {
          const probe = RedisClient.create({
            socket: { host: '127.0.0.1', port: server.port, reconnectStrategy: false }
          });
          try {
            await probe.connect();
            probe.destroy();
            break;
          } catch {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
      // the member clients reconnect on their own backoff — give them a beat
      await new Promise(resolve => setTimeout(resolve, 1000));

      // re-probes, re-selects, and lifts the permanent-unavailability gate
      await client.connect();
      assert.equal(controller.getActiveDatabase().id, 'db-0');
      assert.equal(await (client as { ping(): Promise<string> }).ping(), 'PONG');
    } finally {
      traffic.stop();
      client.destroy();
    }
  });
});
