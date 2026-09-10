import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import testUtils from '../test-utils';
import { createMultiDbClient, DefaultHealthCheck, MultiDbResult } from '.';
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
        initialAvailability: 'all'
      });
      try {
        await assert.rejects(client.connect(), /initial availability 'all'/);
      } finally {
        client.destroy();
      }
    });

    it("'majority' resolves with 2 of 3 healthy", () =>
      withMultiDb(
        {
          databases: [memberOf(serverA), memberOf(serverB), DEAD_MEMBER],
          initialAvailability: 'majority'
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
        initialAvailability: 'majority'
      });
      try {
        await assert.rejects(client.connect(), /initial availability 'majority'/);
      } finally {
        client.destroy();
      }
    });

    it("'one' resolves and skips the unhealthy top-weight member", () =>
      withMultiDb(
        {
          databases: [{ ...DEAD_MEMBER, weight: 1 }, memberOf(serverA, { weight: 0.5 })],
          initialAvailability: 'one'
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
          (client as any).on('failover', event => {
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
        async ({ client, controller }) => {
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
          initialAvailability: 'one',
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
          const ns = (client as any).mymod;
          assert.equal(ns, (client as any).mymod, 'namespace reference must be stable');

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
