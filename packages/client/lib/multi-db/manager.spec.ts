import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';
import { MultiDbManager } from './manager';
import type { MemberAdapter, ResolvedMemberConfig } from './manager';
import { resolveMultiDbConfig } from './config';
import type { MultiDbConfig } from './config';
import type { MultiDbEventOutlet } from './manager';
import type { AnyRedisClientType } from './index';
import { PermanentlyUnavailableError } from './errors';

/**
 * Unit coverage for the manager's decision paths through a stub adapter —
 * no sockets, no docker. Fake members are scriptable EventEmitters; probes
 * route through the adapter's sendCommand into each fake's `onCommand`.
 */

class FakeClient extends EventEmitter {
  isOpen = false;
  closed = false;
  destroyed = false;
  commandCount = 0;
  commandTimes: Array<number> = [];
  /** scriptable probe/command behavior; default: healthy PONG */
  onCommand: () => Promise<unknown> = async () => 'PONG';
  /** scriptable connect behavior; default: immediate success */
  onConnect: () => Promise<void> = async () => {};

  async connect(): Promise<this> {
    await this.onConnect();
    this.isOpen = true;
    this.emit('ready');
    return this;
  }

  async close(): Promise<void> {
    this.closed = true;
    this.isOpen = false;
  }

  destroy(): void {
    this.destroyed = true;
    this.isOpen = false;
  }

  /** simulate the client giving up reconnecting */
  end(): void {
    this.isOpen = false;
    this.emit('end');
  }

  handleCommand(): Promise<unknown> {
    this.commandCount++;
    this.commandTimes.push(Date.now());
    return this.onCommand();
  }
}

const FAST: MultiDbConfig = {
  healthCheck: { interval: 30, timeout: 25, numProbes: 1, delayBetweenProbes: 0 },
  failureDetector: { minNumOfFailures: 2, failureRateThreshold: 0, windowSize: 10_000 },
  gracePeriod: 60_000, // an opened circuit stays OPEN unless a test wants otherwise
  maxFailoverAttempts: 3,
  delayBetweenFailoverAttempts: 20
};

interface Harness {
  mgr: MultiDbManager<AnyRedisClientType>;
  fakes: Map<string, FakeClient>;
  events: EventEmitter;
  received: Array<{ event: string; payload: unknown }>;
  /** configure a fake before the manager sees it (runtime adds) */
  onCreate?: (fake: FakeClient, id: string) => void;
}

function makeHarness(memberCount: number, overrides: MultiDbConfig = {}): Harness {
  const harness = {} as Harness;
  const fakes = new Map<string, FakeClient>();
  const adapter: MemberAdapter<AnyRedisClientType> = {
    create: config => {
      const fake = new FakeClient();
      const id = (config as ResolvedMemberConfig).id;
      fakes.set(id, fake);
      harness.onCreate?.(fake, id);
      return fake as unknown as AnyRedisClientType;
    },
    sendCommand: client => (client as unknown as FakeClient).handleCommand()
  };
  const { databases, config } = resolveMultiDbConfig(
    Array.from({ length: memberCount }, () => ({ options: {} })),
    { ...FAST, ...overrides }
  );
  const mgr = new MultiDbManager(databases, config, adapter);
  const events = new EventEmitter();
  const received: Array<{ event: string; payload: unknown }> = [];
  for (const name of ['failover', 'fallback', 'database-unhealthy', 'database-recovered', 'all-databases-down', 'error',
    'connect', 'ready', 'terminated', 'end', 'member-error', 'member-ready', 'member-end']) {
    events.on(name, payload => received.push({ event: name, payload }));
  }
  mgr.bindEvents(events as unknown as MultiDbEventOutlet);
  harness.mgr = mgr;
  harness.fakes = fakes;
  harness.events = events;
  harness.received = received;
  return harness;
}

const tick = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('multi-db manager (unit)', function () {
  this.timeout(5_000);

  it("a member's terminal 'end' fails the active over immediately", async () => {
    const { mgr, fakes, received } = makeHarness(2);
    await mgr.connect();
    assert.equal(mgr.activeDatabase.id, 'db-0');

    fakes.get('db-0')!.end();

    assert.deepEqual(received.filter(r => r.event === 'failover'), [
      { event: 'failover', payload: { from: 'db-0', to: 'db-1', reason: 'failure-detector' } }
    ]);
    assert.equal(mgr.activeDatabase.id, 'db-1');
    // an ended member reports DISCONNECTED, not PASSIVE
    assert.equal(mgr.databases[0].role, 'DISCONNECTED');
    assert.equal(mgr.databases[0].circuit.state, 'OPEN');
    mgr.destroy();
  });

  it('settlements from a no-longer-active member never trip the new active', async () => {
    const { mgr, received } = makeHarness(2);
    await mgr.connect();
    const [db0, db1] = mgr.databases;
    const boom = new Error('boom');

    // one failure on db-0 (threshold is 2), then a forced switch resets the detector
    mgr.onCommandResult(false, boom, db0);
    mgr.switchTo(db1, 'forced');
    assert.equal(mgr.activeDatabase.id, 'db-1');
    const failoversAfterSwitch = received.filter(r => r.event === 'failover').length;

    // stale settlements from db-0 arriving after the switch must be dropped …
    for (let i = 0; i < 5; i++) {
      mgr.onCommandResult(false, boom, db0);
    }
    // … and the pre-switch failure must not count toward db-1's threshold
    mgr.onCommandResult(false, boom, db1);

    assert.equal(mgr.activeDatabase.id, 'db-1');
    assert.equal(received.filter(r => r.event === 'failover').length, failoversAfterSwitch);

    // sanity: the threshold itself still works against the current active
    mgr.onCommandResult(false, boom, db1);
    assert.notEqual(mgr.activeDatabase.id, 'db-1');
    mgr.destroy();
  });

  it('a probe round outlasting the check interval never overlaps the next round', async () => {
    // one round ≈ 3 probes × 15ms + 2 × 20ms gaps ≈ 85ms, interval 30ms:
    // two interval ticks land while a round is still running
    const { mgr, fakes } = makeHarness(1, {
      healthCheck: { interval: 30, timeout: 25, numProbes: 3, delayBetweenProbes: 20 }
    });
    await mgr.connect();

    const fake = fakes.get('db-0')!;
    let inFlight = 0;
    let maxInFlight = 0;
    fake.onCommand = async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await tick(15);
      inFlight--;
      return 'PONG';
    };

    await tick(300);
    mgr.destroy();
    assert.equal(maxInFlight, 1);
  });

  it('a recovery round stops when the circuit leaves HALF_OPEN mid-round', async () => {
    const { mgr, fakes, received } = makeHarness(2, {
      gracePeriod: 40,
      healthCheck: { interval: 30, timeout: 25, numProbes: 3, delayBetweenProbes: 10 }
    });
    await mgr.connect();

    const passive = mgr.databases[1];
    const fake = fakes.get('db-1')!;
    passive.circuit.open();
    fake.commandCount = 0;
    fake.commandTimes = []; // drop connect()'s own probe round

    // first recovery probe succeeds, then the circuit is yanked out of
    // HALF_OPEN — the round must stop instead of running probes 2 and 3
    fake.onCommand = async () => {
      passive.circuit.open();
      return 'PONG';
    };

    // grace (40ms) + interval alignment: at least one recovery round runs
    await tick(150);
    mgr.destroy();

    // an unaborted round would fire its next probe delayBetweenProbes (10ms)
    // later; after an abort the next probe belongs to the NEXT half-open
    // cycle, a full grace period + interval away
    assert.ok(fake.commandCount >= 1, 'a recovery probe must have run');
    fake.commandTimes.slice(1).forEach((time, i) => {
      assert.ok(
        time - fake.commandTimes[i] >= 50,
        `probes ${i} and ${i + 1} are ${time - fake.commandTimes[i]}ms apart — same round, abort failed`
      );
    });
    assert.deepEqual(received.filter(r => r.event === 'database-recovered'), []);
  });

  it('destroy() during the all-down search stops the loop quietly', async () => {
    const { mgr, fakes, received } = makeHarness(2, {
      maxFailoverAttempts: 50,
      delayBetweenFailoverAttempts: 20
    });
    await mgr.connect();

    const rejections: Array<unknown> = [];
    const onRejection = (err: unknown) => rejections.push(err);
    process.on('unhandledRejection', onRejection);
    try {
      mgr.databases[1].circuit.open(); // no replacement available
      fakes.get('db-0')!.end();        // active dies → search loop starts

      await tick(50); // a couple of attempts fire
      const attemptsAtDestroy = received.filter(r => r.event === 'all-databases-down').length;
      assert.ok(attemptsAtDestroy >= 1, 'the search loop must be running');

      mgr.destroy();
      await tick(100);

      assert.equal(
        received.filter(r => r.event === 'all-databases-down').length,
        attemptsAtDestroy,
        'no further attempts after destroy()'
      );
      assert.deepEqual(rejections, []);
    } finally {
      process.off('unhandledRejection', onRejection);
    }
  });

  it('removing the active member without a healthy replacement throws and changes nothing', async () => {
    const { mgr } = makeHarness(2);
    await mgr.connect();

    mgr.databases[1].circuit.open();
    await assert.rejects(mgr.removeDatabase('db-0'), /no healthy replacement/);

    assert.equal(mgr.activeDatabase.id, 'db-0');
    assert.equal(mgr.databases.length, 2);
    mgr.destroy();
  });

  it('a healthy member added during the all-down search rescues it', async () => {
    const { mgr, received } = makeHarness(2, {
      maxFailoverAttempts: 100,
      delayBetweenFailoverAttempts: 25
    });
    await mgr.connect();

    mgr.databases[1].circuit.open();
    (mgr.databases[0].client as unknown as FakeClient).end();
    await tick(30);
    assert.ok(mgr.unavailableError, 'the search gate must be up');

    const id = await mgr.addDatabase({ options: {} });
    // the next search attempt selects the new CLOSED-circuit member
    const deadline = Date.now() + 1_000;
    while (mgr.unavailableError && Date.now() < deadline) {
      await tick(10);
    }

    assert.equal(mgr.unavailableError, undefined, 'the rescue must lift the gate');
    assert.equal(mgr.activeDatabase.id, id);
    assert.ok(received.some(r => r.event === 'failover' && (r.payload as { to: string }).to === id));
    mgr.destroy();
  });

  it('emits the logical lifecycle: connect, ready, terminated, ready again after recovery, end', async () => {
    const { mgr, fakes, received } = makeHarness(2, {
      maxFailoverAttempts: 2,
      delayBetweenFailoverAttempts: 10
    });
    const lifecycle = () => received
      .map(r => r.event)
      .filter(e => e === 'connect' || e === 'ready' || e === 'terminated' || e === 'end');

    await mgr.connect();
    assert.deepEqual(lifecycle(), ['connect', 'ready']);

    mgr.databases[1].circuit.open(); // no replacement: the search must exhaust
    fakes.get('db-0')!.end();
    const deadline = Date.now() + 1_000;
    while (!lifecycle().includes('terminated') && Date.now() < deadline) {
      await tick(10);
    }
    assert.deepEqual(lifecycle(), ['connect', 'ready', 'terminated']);
    const terminated = received.find(r => r.event === 'terminated');
    assert.deepEqual(terminated?.payload, { attempts: 2 });

    // recovery is connect()'s job — and it must announce readiness again
    await mgr.connect();
    assert.deepEqual(lifecycle(), ['connect', 'ready', 'terminated', 'connect', 'ready']);

    await mgr.destroy();
    assert.deepEqual(lifecycle(), ['connect', 'ready', 'terminated', 'connect', 'ready', 'end']);
  });

  it('re-emits member lifecycle as member-* events with ids in the payload', async () => {
    const { mgr, fakes, received } = makeHarness(2);
    await mgr.connect();
    received.length = 0;

    const boom = new Error('member exploded');
    fakes.get('db-1')!.emit('error', boom);
    fakes.get('db-1')!.emit('ready');
    fakes.get('db-1')!.end();

    assert.deepEqual(
      received.filter(r => r.event.startsWith('member-')),
      [
        { event: 'member-error', payload: { id: 'db-1', error: boom } },
        { event: 'member-ready', payload: { id: 'db-1' } },
        { event: 'member-end', payload: { id: 'db-1' } }
      ]
    );
    mgr.destroy();
  });

  it('removing a member while addDatabase is still establishing leaks no health timer', async () => {
    const harness = makeHarness(1, {
      // tiny grace: a leaked interval becomes visible as recovery probes
      gracePeriod: 40,
      healthCheck: { interval: 25, timeout: 20, numProbes: 1, delayBetweenProbes: 0 }
    });
    const { mgr, fakes } = harness;
    await mgr.connect();

    // the new member connects slower than the probe budget — the removal
    // lands while addDatabase is still establishing
    harness.onCreate = (fake, id) => {
      if (id === 'db-1') {
        fake.onConnect = async () => {
          await tick(50);
        };
      }
    };
    const adding = mgr.addDatabase({ options: {} });
    await tick(10);
    await mgr.removeDatabase('db-1');
    await adding;

    // past the grace period a leaked interval would fire recovery probes
    const added = fakes.get('db-1')!;
    added.commandCount = 0;
    await tick(200);
    mgr.destroy();
    assert.equal(added.commandCount, 0, 'a removed member must receive no background probes');
  });

  it('a member removed while its check round is in flight announces nothing', async () => {
    const { mgr, fakes, received } = makeHarness(2, {
      healthCheck: { interval: 100, timeout: 90, numProbes: 1, delayBetweenProbes: 0 }
    });
    await mgr.connect();
    received.length = 0;

    // the passive member's probe hangs past its timeout — the removal lands
    // mid-round, the probe then fails and the round finishes after removal
    const passive = fakes.get('db-1')!;
    passive.onCommand = async () => {
      await tick(300);
      return 'PONG';
    };
    await tick(130); // the round started at ~100ms is now in flight
    await mgr.removeDatabase('db-1');
    await tick(150); // the probe times out at ~190ms and the round finishes

    assert.deepEqual(
      received.filter(r => r.event === 'database-unhealthy'),
      [],
      'a removed member must not be announced unhealthy'
    );
    mgr.destroy();
  });

  it('addDatabase and setActiveDatabase reject on a closed client without touching members', async () => {
    const { mgr, fakes } = makeHarness(2);
    await mgr.connect();
    mgr.destroy();

    await assert.rejects(mgr.addDatabase({ options: {} }), /the client is closed/);
    assert.equal(fakes.has('db-2'), false, 'no member client may be created after teardown');
    await assert.rejects(mgr.setActiveDatabase('db-1'), /the client is closed/);
  });

  it('destroy() awaits async member teardown and never leaks a rejection', async () => {
    const { mgr, fakes } = makeHarness(2);
    await mgr.connect();

    const rejections: Array<unknown> = [];
    const onRejection = (err: unknown) => rejections.push(err);
    process.on('unhandledRejection', onRejection);
    try {
      let settledLate = false;
      const failing = fakes.get('db-1')!;
      // an async, REJECTING teardown (the sentinel shape, worst case)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- overriding the fake's sync signature
      (failing as any).destroy = async () => {
        await tick(30);
        settledLate = true;
        throw new Error('teardown exploded');
      };

      await mgr.destroy();
      assert.equal(settledLate, true, 'destroy() must await the member teardown');
      await tick(20);
      assert.deepEqual(rejections, []);
    } finally {
      process.off('unhandledRejection', onRejection);
    }
  });

  it('a force finishing after search exhaustion rejects instead of half-succeeding', async () => {
    const { mgr, fakes, received } = makeHarness(2, {
      maxFailoverAttempts: 2,
      delayBetweenFailoverAttempts: 10,
      healthCheck: { interval: 200, timeout: 150, numProbes: 1, delayBetweenProbes: 0 }
    });
    await mgr.connect();

    // the force target answers slowly: its verification probe outlives the search
    fakes.get('db-1')!.onCommand = async () => {
      await tick(100);
      return 'PONG';
    };
    mgr.databases[1].circuit.open(); // no replacement available
    fakes.get('db-0')!.end();        // search starts, exhausts at ~20ms

    await assert.rejects(mgr.setActiveDatabase('db-1'), /permanently unavailable/);

    assert.ok(mgr.unavailableError instanceof PermanentlyUnavailableError);
    assert.equal(mgr.activeDatabase.id, 'db-0');
    assert.ok(
      !received.some(r => r.event === 'failover' && (r.payload as { reason: string }).reason === 'forced'),
      'the half-succeeded force must not announce a switch'
    );
    mgr.destroy();
  });

  it('addDatabase after permanent failure joins the set but does not lift the gate', async () => {
    const { mgr } = makeHarness(2, {
      maxFailoverAttempts: 2,
      delayBetweenFailoverAttempts: 10
    });
    await mgr.connect();

    mgr.databases[1].circuit.open();
    (mgr.databases[0].client as unknown as FakeClient).end();
    const deadline = Date.now() + 1_000;
    while (!(mgr.unavailableError instanceof PermanentlyUnavailableError) && Date.now() < deadline) {
      await tick(10);
    }
    assert.ok(mgr.unavailableError instanceof PermanentlyUnavailableError);

    // pins current behavior: the member joins healthy, yet 'failed' stays
    // terminal — recovery is connect()'s job
    const id = await mgr.addDatabase({ options: {} });
    assert.ok(mgr.databases.some(db => db.id === id && db.circuit.state === 'CLOSED'));
    assert.ok(mgr.unavailableError instanceof PermanentlyUnavailableError);
    mgr.destroy();
  });
});
