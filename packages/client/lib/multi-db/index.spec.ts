import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import testUtils from '../test-utils';
import { createMultiDbClient, createMultiDbClientPool, DefaultHealthCheck, MultiDbResult } from '.';
import type { FailureDetector } from '.';
import type { FailoverEvent } from './controller';
import RedisClient, { RedisClientType } from '../client';
import { ErrorReply } from '../errors';
import type { CommandParser } from '../client/parser';
import { RESP_TYPES } from '../RESP/decoder';
import type { RedisServerDocker } from '@redis/test-utils';

const execFileAsync = promisify(execFile);

// single fast probe; its timeout also bounds member connects, so 1s gives
// loaded-CI headroom while dead members still fail instantly (connection refused)
const FAST = {
  healthCheck: { interval: 3000, timeout: 1000, numProbes: 1, delayBetweenProbes: 0 }
};

// nothing listens here; reconnectStrategy false makes connect() fail fast
const DEAD_MEMBER = {
  options: {
    socket: { host: '127.0.0.1', port: 65_432, reconnectStrategy: false as const }
  }
};

describe('multi-db', function () {
  this.timeout(30_000);

  let serverA: RedisServerDocker;
  let serverB: RedisServerDocker;
  const memberOf = (server: RedisServerDocker, extra?: { id?: string; weight?: number }) => ({
    ...extra,
    options: { socket: { host: '127.0.0.1', port: server.port } }
  });

  before(async function () {
    this.timeout(120_000);
    // allSettled + rethrow: if one spawn fails, the other container must still
    // reach the after() cleanup instead of leaking
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

  /** run `fn` against a fresh multi-db client, always destroying it afterwards */
  async function withMultiDb(
    options: Parameters<typeof createMultiDbClient>[0],
    fn: (result: MultiDbResult<RedisClientType>) => Promise<void>
  ): Promise<void> {
    const result = createMultiDbClient({ ...FAST, ...options });
    try {
      await result.client.connect();
      await fn(result);
    } finally {
      result.client.destroy();
    }
  }

  describe('initial selection', () => {
    it('equal weights: the first configured member becomes active', () =>
      withMultiDb({ databases: [memberOf(serverA), memberOf(serverB)] }, async ({ client, controller }) => {
        assert.equal(controller.getActiveDatabase().id, 'db-0');
        assert.deepEqual(
          controller.getDatabases().map(db => ({ id: db.id, role: db.role, circuitState: db.circuitState })),
          [
            { id: 'db-0', role: 'ACTIVE', circuitState: 'CLOSED' },
            { id: 'db-1', role: 'PASSIVE', circuitState: 'CLOSED' }
          ]
        );
        await client.set('key', 'value');
        assert.equal(await client.get('key'), 'value');
      })
    );

    it('a repeat connect() re-probes without corrupting member state', () =>
      withMultiDb({ databases: [memberOf(serverA), memberOf(serverB)] }, async ({ client, controller }) => {
        await client.connect();
        assert.deepEqual(controller.getDatabases().map(db => db.circuitState), ['CLOSED', 'CLOSED']);
        assert.equal(await client.ping(), 'PONG');
      })
    );

    it('the highest-weight member becomes active and receives the traffic', () =>
      withMultiDb(
        { databases: [memberOf(serverA, { weight: 0.5 }), memberOf(serverB, { weight: 1 })] },
        async ({ client, controller }) => {
          assert.equal(controller.getActiveDatabase().id, 'db-1');

          await client.set('weighted', 'yes');
          const direct = RedisClient.create({ socket: { host: '127.0.0.1', port: serverB.port } });
          await direct.connect();
          try {
            assert.equal(await direct.get('weighted'), 'yes');
          } finally {
            direct.destroy();
          }
        }
      )
    );
  });

  describe('initialAvailability', () => {
    it("'all' rejects when any member is down", async () => {
      const { client } = createMultiDbClient({
        ...FAST,
        databases: [memberOf(serverA), DEAD_MEMBER],
        initialAvailability: 'ALL'
      });
      try {
        await assert.rejects(client.connect(), /initial availability .ALL./);
      } finally {
        client.destroy();
      }
    });

    it("'majority' resolves with 2 of 3 healthy", () =>
      withMultiDb(
        {
          databases: [memberOf(serverA), memberOf(serverB), DEAD_MEMBER],
          initialAvailability: 'MAJORITY'
        },
        async ({ controller }) => {
          assert.equal(controller.getActiveDatabase().id, 'db-0');
          assert.equal(controller.getDatabases()[2].circuitState, 'OPEN');
        }
      )
    );

    it("'majority' rejects with 1 of 3 healthy", async () => {
      const { client } = createMultiDbClient({
        ...FAST,
        databases: [memberOf(serverA), DEAD_MEMBER, { options: { ...DEAD_MEMBER.options, socket: { ...DEAD_MEMBER.options.socket, port: 65_433 } } }],
        initialAvailability: 'MAJORITY'
      });
      try {
        await assert.rejects(client.connect(), /initial availability .MAJORITY./);
      } finally {
        client.destroy();
      }
    });

    it("'one' resolves and skips the unhealthy top-weight member", () =>
      withMultiDb(
        {
          databases: [{ ...DEAD_MEMBER, weight: 1 }, memberOf(serverA, { weight: 0.5 })],
          initialAvailability: 'ONE'
        },
        async ({ client, controller }) => {
          assert.equal(controller.getActiveDatabase().id, 'db-1');
          assert.equal(await client.ping(), 'PONG');
        }
      )
    );
  });

  describe('runtime reconfiguration', () => {
    it('addDatabase joins the set and generates an id', () =>
      withMultiDb({ databases: [memberOf(serverA)] }, async ({ controller }) => {
        const id = await controller.addDatabase(memberOf(serverB));
        assert.equal(id, 'db-1');
        assert.deepEqual(
          controller.getDatabases().map(db => ({ id: db.id, circuitState: db.circuitState, role: db.role })),
          [
            { id: 'db-0', circuitState: 'CLOSED', role: 'ACTIVE' },
            { id: 'db-1', circuitState: 'CLOSED', role: 'PASSIVE' }
          ]
        );
      })
    );

    it('addDatabase resolves for an unreachable member and leaves its circuit OPEN', () =>
      withMultiDb({ databases: [memberOf(serverA)] }, async ({ controller }) => {
        const id = await controller.addDatabase(DEAD_MEMBER);
        assert.equal(id, 'db-1');
        assert.deepEqual(
          controller.getDatabases().map(db => ({ id: db.id, circuitState: db.circuitState })),
          [
            { id: 'db-0', circuitState: 'CLOSED' },
            { id: 'db-1', circuitState: 'OPEN' }
          ]
        );
      })
    );

    it('skipInitialHealthCheck skips the probe round on runtime add', () =>
      withMultiDb(
        {
          databases: [memberOf(serverA)],
          healthChecks: [{ probe: async target => !target.id.startsWith('flaky') }]
        },
        async ({ controller }) => {
          await controller.addDatabase(memberOf(serverB, { id: 'flaky-checked' }));
          await controller.addDatabase({
            ...memberOf(serverB, { id: 'flaky-skipped' }),
            skipInitialHealthCheck: true
          });
          const circuits = new Map(controller.getDatabases().map(db => [db.id, db.circuitState]));
          assert.equal(circuits.get('flaky-checked'), 'OPEN');
          assert.equal(circuits.get('flaky-skipped'), 'CLOSED');
        }
      )
    );

    it('rejects a duplicate id on runtime add', () =>
      withMultiDb({ databases: [memberOf(serverA)] }, async ({ controller }) => {
        await assert.rejects(
          controller.addDatabase({ ...memberOf(serverB), id: 'db-0' }),
          /duplicate database id "db-0"/
        );
      })
    );

    it('removing the active member switches to the replacement first', () =>
      withMultiDb(
        { databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })] },
        async ({ client, controller }) => {
          const events: Array<FailoverEvent> = [];
          client.on('failover', event => {
            events.push(event);
          });

          await controller.removeDatabase('db-0');

          assert.deepEqual(events, [{ from: 'db-0', to: 'db-1', reason: 'active-removed' }]);
          assert.equal(controller.getActiveDatabase().id, 'db-1');
          assert.equal(controller.getDatabases().length, 1);
          assert.equal(await client.ping(), 'PONG');
        }
      )
    );

    it('rejects removing the last member or an unknown id', () =>
      withMultiDb({ databases: [memberOf(serverA)] }, async ({ controller }) => {
        await assert.rejects(controller.removeDatabase('db-0'), /last database/);
        await assert.rejects(controller.removeDatabase('nope'), /no database with id/);
      })
    );

    it('setWeight validates and updates the descriptor', () =>
      withMultiDb({ databases: [memberOf(serverA)] }, async ({ controller }) => {
        assert.throws(() => controller.setWeight('db-0', 2), /within \[0, 1\]/);
        controller.setWeight('db-0', 0.25);
        assert.equal(controller.getDatabases()[0].weight, 0.25);
      })
    );
  });

  describe('extension points', () => {
    it('the error filter keeps chosen error types from tripping the detector', () =>
      withMultiDb(
        {
          databases: [memberOf(serverA), memberOf(serverB)],
          failureDetector: {
            minNumOfFailures: 1,
            failureRateThreshold: 0,
            windowSize: 5000,
            errorFilter: err => !(err instanceof ErrorReply)
          }
        },
        async ({ client, controller }) => {
          for (let i = 0; i < 3; i++) {
            await assert.rejects(client.sendCommand(['NOSUCHCOMMAND']), ErrorReply);
          }
          assert.equal(controller.getActiveDatabase().id, 'db-0');
        }
      )
    );

    it('a custom failure detector drives the failover decision', () => {
      let faulty = false;
      const detector: FailureDetector = {
        onCommandResult(ok) {
          if (!ok) faulty = true;
        },
        isFaulty: () => faulty,
        reset() {
          faulty = false;
        }
      };
      return withMultiDb(
        { databases: [memberOf(serverA), memberOf(serverB)], failureDetector: detector },
        async ({ client }) => {
          const failover = new Promise(resolve => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- multi-db events are untyped on the generic wrapper
            (client as any).once('failover', resolve);
          });
          await assert.rejects(client.sendCommand(['NOSUCHCOMMAND']));
          assert.deepEqual(await failover, { from: 'db-0', to: 'db-1', reason: 'failure-detector' });
          assert.equal(faulty, false, 'the switch must reset the detector');
        }
      );
    });

    it('chained health checks must all pass for a member to establish', () =>
      withMultiDb(
        {
          databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })],
          initialAvailability: 'ONE',
          healthChecks: [new DefaultHealthCheck(), { probe: async target => target.id !== 'db-0' }]
        },
        async ({ controller }) => {
          assert.equal(controller.getActiveDatabase().id, 'db-1');
          assert.deepEqual(
            controller.getDatabases().map(db => db.circuitState),
            ['OPEN', 'CLOSED']
          );
        }
      )
    );
  });

  describe('module namespaces', () => {
    const nsModule = {
      bump: {
        parseCommand(parser: CommandParser, key: string) {
          parser.push('INCR', key);
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

    it('a namespace reference is stable and follows the active member across a forced switch', () =>
      withMultiDb(
        { databases: [memberWithModule(serverA, { weight: 1 }), memberWithModule(serverB, { weight: 0.5 })] },
        async ({ client, controller }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- module surface is untyped on the generic wrapper
          const namespaceOf = (c: unknown) => (c as any).mymod;
          const ns = namespaceOf(client);
          assert.equal(ns, namespaceOf(client), 'namespace reference must be stable');

          await ns.bump('mymod-counter');
          await controller.setActiveDatabase('db-1');
          await ns.bump('mymod-counter');

          const direct = RedisClient.create({ socket: { host: '127.0.0.1', port: serverB.port } });
          await direct.connect();
          try {
            assert.equal(
              await direct.get('mymod-counter'), '1',
              'the captured reference must serve from the new active member'
            );
          } finally {
            direct.destroy();
          }
        }
      )
    );
  });

  describe('derived views', () => {
    it('a view keeps serving across three consecutive forced switches', () =>
      withMultiDb(
        { databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })] },
        async ({ client, controller }) => {
          const view = client.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer });
          await view.set('view-key', 'v0');

          const targets = ['db-1', 'db-0', 'db-1'];
          for (let i = 0; i < targets.length; i++) {
            await controller.setActiveDatabase(targets[i]);
            await view.set('view-key', `v${i + 1}`);
            const reply = await view.get('view-key');
            assert.ok(Buffer.isBuffer(reply), 'the view type mapping must apply after a switch');
            assert.equal(reply.toString(), `v${i + 1}`);
          }

          // the last write landed on the member active at call time (db-1)
          const direct = RedisClient.create({ socket: { host: '127.0.0.1', port: serverB.port } });
          await direct.connect();
          try {
            assert.equal(await direct.get('view-key'), 'v3', 'view writes must follow the active member');
          } finally {
            direct.destroy();
          }
        }
      )
    );

    it('two views with different mappings apply their own options concurrently', () =>
      withMultiDb({ databases: [memberOf(serverA)] }, async ({ client }) => {
        const asBuffer = client.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer });
        await client.set('view-two', 'x');
        const [buf, str] = await Promise.all([asBuffer.get('view-two'), client.get('view-two')]);
        assert.ok(Buffer.isBuffer(buf));
        assert.equal(str, 'x');
      })
    );

    it('a view created before connect() serves once connected', async () => {
      const { client } = createMultiDbClient({ ...FAST, databases: [memberOf(serverA)] });
      const view = client.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer });
      await client.connect();
      try {
        assert.equal(await view.ping(), 'PONG');
      } finally {
        client.destroy();
      }
    });
  });

  describe('pinned surfaces', () => {
    it('multi() executes on the member captured at creation, and its outcome never trips the new active', () =>
      withMultiDb(
        {
          failureDetector: { minNumOfFailures: 1, failureRateThreshold: 0, windowSize: 60_000 },
          databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })]
        },
        async ({ client, controller }) => {
          const failovers: Array<{ reason: string }> = [];
           
          client.on('failover', (event: { reason: string }) => failovers.push(event));

          // the transaction pins to db-0; the switch must not move it
          const tx = client.multi().set('pinned-tx', 'on-a');
          await controller.setActiveDatabase('db-1');
          assert.ok(await tx.exec());

          const directA = RedisClient.create({ socket: { host: '127.0.0.1', port: serverA.port } });
          const directB = RedisClient.create({ socket: { host: '127.0.0.1', port: serverB.port } });
          await Promise.all([directA.connect(), directB.connect()]);
          try {
            assert.equal(await directA.get('pinned-tx'), 'on-a', 'the transaction must execute on its pinned member');
            assert.equal(await directB.get('pinned-tx'), null);
          } finally {
            directA.destroy();
            directB.destroy();
          }

          // a failing exec attributed to a DEMOTED member must not trip the
          // active one (detector threshold is 1 — any misattribution fails over)
          const staleTx = client.multi().addCommand(['NOSUCHCOMMAND']);
          await controller.setActiveDatabase('db-0');
          await assert.rejects(staleTx.exec());
          await new Promise(resolve => setTimeout(resolve, 200));
          assert.ok(
            failovers.every(event => event.reason === 'forced'),
            'a demoted member\u2019s exec failure must not cause an automatic failover'
          );

          // …while a failing exec on the ACTIVE pinned member must feed the
          // detector like any other command outcome
          const activeTx = client.multi().addCommand(['NOSUCHCOMMAND']);
          await assert.rejects(activeTx.exec());
          const deadline = Date.now() + 2_000;
          while (!failovers.some(event => event.reason === 'failure-detector') && Date.now() < deadline) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          assert.ok(
            failovers.some(event => event.reason === 'failure-detector'),
            'an active member\u2019s exec failure must count toward the detector'
          );
        }
      )
    );

    it('a scan iterator stays pinned to its member and fails if that member is removed', () =>
      withMultiDb(
        { databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })] },
        async ({ client, controller }) => {
          for (let i = 0; i < 10; i++) {
            await client.set(`scan-pin:${i}`, 'x');
          }
          const iterator = client.scanIterator({ MATCH: 'scan-pin:*', COUNT: 3 });
          const seen: Array<string> = [];
          const first = await iterator.next();
          assert.equal(first.done, false);
          seen.push(...(first.value as Array<string>));

          // the switch must not redirect the cursor to another member
          await controller.setActiveDatabase('db-1');
          for await (const keys of { [Symbol.asyncIterator]: () => iterator }) {
            seen.push(...(keys as Array<string>));
          }
          assert.equal(new Set(seen).size, 10, 'the iterator must finish its pinned member\u2019s keyspace');

          // an iterator whose pinned member is removed fails with that member's error
          const pinnedToB = client.scanIterator();
          await controller.removeDatabase('db-1'); // active removal: switches back to db-0, destroys db-1
          await assert.rejects(pinnedToB.next());
        }
      )
    );
  });

  describe('duplicate()', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- duplicate's multi-db result shape is asserted at runtime
    type DupResult = { client: any; controller: any };

    it('returns an independent, unconnected multi-db pair over the live member set', () =>
      withMultiDb(
        { databases: [memberOf(serverA, { weight: 1 }), memberOf(serverB, { weight: 0.5 })] },
        async ({ client, controller }) => {
          const dup = (client.duplicate() as unknown) as DupResult;
          assert.equal(typeof dup.client.connect, 'function');
          assert.deepEqual(
            dup.controller.getDatabases().map((db: { id: string }) => db.id),
            ['db-0', 'db-1']
          );

          await dup.client.connect();
          try {
            await dup.client.set('dup-key', '1');

            // independent selection: forcing the original must not move the duplicate
            await controller.setActiveDatabase('db-1');
            assert.equal(controller.getActiveDatabase().id, 'db-1');
            assert.equal(dup.controller.getActiveDatabase().id, 'db-0');

            // destroying the original leaves the duplicate serving
            client.destroy();
            assert.equal(await dup.client.get('dup-key'), '1');
          } finally {
            dup.client.destroy();
          }
        }
      )
    );

    it('clones runtime-added members and merges overrides into every member', () =>
      withMultiDb({ databases: [memberOf(serverA)] }, async ({ client, controller }) => {
        await controller.addDatabase({ options: { socket: { host: '127.0.0.1', port: serverB.port } } });

        const dup = (client.duplicate({ database: 1 }) as unknown) as DupResult;
        assert.deepEqual(
          dup.controller.getDatabases().map((db: { id: string }) => db.id),
          ['db-0', 'db-1'],
          'the duplicate must reflect the current live member set'
        );

        await dup.client.connect();
        try {
          await dup.client.set('dup-override', 'yes');
          // the override must reach the member the duplicate serves from
          const direct = RedisClient.create({ socket: { host: '127.0.0.1', port: serverA.port }, database: 1 });
          await direct.connect();
          try {
            assert.equal(await direct.get('dup-override'), 'yes', 'overrides must merge into every member');
          } finally {
            direct.destroy();
          }
        } finally {
          dup.client.destroy();
        }
      })
    );
  });

  describe('pool members', () => {
    it('poolOptions reach the pool and a saturated pool still serves across a switch', async () => {
      const { client, controller } = createMultiDbClientPool({
        ...FAST,
        databases: [
          { weight: 1, poolOptions: { minimum: 1, maximum: 2 }, options: { socket: { host: '127.0.0.1', port: serverA.port } } },
          { weight: 0.5, poolOptions: { minimum: 1, maximum: 2 }, options: { socket: { host: '127.0.0.1', port: serverB.port } } }
        ]
      });
      await client.connect();
      try {
        // the sizing must actually reach the member pool (forwarded getters)
        assert.equal(client.totalClients, 1, 'minimum must apply');

        // saturate beyond maximum: all commands must still complete (queued),
        // and the pool must never exceed its maximum
        const results = await Promise.all(
          Array.from({ length: 10 }, (_, i) => client.set(`pool-sat:${i}`, String(i)))
        );
        assert.equal(results.length, 10);
        assert.ok(client.totalClients <= 2, `maximum must cap the pool, got ${client.totalClients}`);

        // the pool member keeps serving after a forced switch
        await controller.setActiveDatabase('db-1');
        await Promise.all(
          Array.from({ length: 5 }, (_, i) => client.set(`pool-sat-b:${i}`, String(i)))
        );
        assert.ok(client.totalClients <= 2);
      } finally {
        client.destroy();
      }
    });
  });

  describe('drop-in contract', () => {
    it('client is assignable to the base client type and behaves like one', () =>
      withMultiDb({ databases: [memberOf(serverA)] }, async ({ client }) => {
        const base: RedisClientType = client;
        await base.set('drop-in', '1');
        assert.equal(await base.get('drop-in'), '1');
        assert.equal(typeof client.multi, 'function');
      })
    );

    it('mirrors the full member API and owns its event emitter', () =>
      withMultiDb({ databases: [memberOf(serverA)] }, async ({ client }) => {
        const direct = RedisClient.create({ socket: { host: '127.0.0.1', port: serverA.port } });
        const missing: Array<string> = [];
        for (
          let proto = Object.getPrototypeOf(direct);
          proto && proto !== EventEmitter.prototype && proto !== Object.prototype;
          proto = Object.getPrototypeOf(proto)
        ) {
          for (const name of Object.getOwnPropertyNames(proto)) {
            if (name === 'constructor') continue;
            if (name.startsWith('_')) continue; // internal plumbing, not user surface
            if (!(name in client)) missing.push(name);
          }
        }
        assert.deepEqual(missing, [], 'every member API surface must exist on the wrapper');
        // emitter methods are the wrapper's own, never forwarders to a member
        assert.equal(client.on, EventEmitter.prototype.on);
        assert.equal(client.emit, EventEmitter.prototype.emit);
      })
    );
  });
});
