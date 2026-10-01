import { strict as assert } from 'node:assert';
import { setTimeout as sleep } from 'node:timers/promises';
import { DefaultFailureDetector } from './failure-detector';
import { defaultErrorFilter } from './error-filter';
import {
  AbortError,
  MultiErrorReply,
  SimpleError,
  SocketClosedUnexpectedlyError,
  TimeoutError,
  WatchError
} from '../errors';

describe('DefaultFailureDetector', () => {
  function createDetector(options: {
    minNumOfFailures?: number;
    failureRateThreshold?: number;
    windowSize?: number;
    errorFilter?: (err: Error) => boolean;
  } = {}) {
    let now = 0;
    const detector = new DefaultFailureDetector({
      minNumOfFailures: 3,
      failureRateThreshold: 50,
      windowSize: 1000,
      ...options,
      clock: () => now
    });
    return {
      detector,
      advance(ms: number) {
        now += ms;
      },
      report(failures: number, successes: number) {
        for (let i = 0; i < failures; i++) detector.onCommandResult(false, new Error('boom'));
        for (let i = 0; i < successes; i++) detector.onCommandResult(true);
      }
    };
  }

  describe('threshold matrix (count AND rate)', () => {
    it('stays healthy below the failure count', () => {
      const { detector, report } = createDetector();
      report(2, 0);
      assert.equal(detector.isFaulty(), false);
    });

    it('trips when both count and rate are reached', () => {
      const { detector, report } = createDetector();
      report(3, 0);
      assert.equal(detector.isFaulty(), true);
    });

    it('stays healthy when the count is reached but the rate is not', () => {
      const { detector, report } = createDetector();
      report(3, 4);
      assert.equal(detector.isFaulty(), false);
    });

    it('trips at the exact rate boundary', () => {
      const { detector, report } = createDetector();
      report(3, 3);
      assert.equal(detector.isFaulty(), true);
    });
  });

  describe('sliding window', () => {
    it('evicts outcomes past the window', () => {
      const { detector, report, advance } = createDetector();
      report(3, 0);
      advance(1000);
      assert.equal(detector.isFaulty(), false);
    });

    it('keeps outcomes still inside the window', () => {
      const { detector, advance } = createDetector();
      detector.onCommandResult(false, new Error('boom'));
      advance(500);
      detector.onCommandResult(false, new Error('boom'));
      detector.onCommandResult(false, new Error('boom'));
      advance(400);
      // the first failure is 900ms old — all three still count
      assert.equal(detector.isFaulty(), true);
    });
  });

  describe('0 disables a condition', () => {
    it('minNumOfFailures 0 = rate-only', () => {
      const { detector, report } = createDetector({ minNumOfFailures: 0 });
      report(1, 1);
      assert.equal(detector.isFaulty(), true);
    });

    it('failureRateThreshold 0 = count-only', () => {
      const { detector, report } = createDetector({ failureRateThreshold: 0 });
      report(3, 97);
      assert.equal(detector.isFaulty(), true);
    });

    it('both 0: any failure trips, no traffic does not', () => {
      const { detector, report } = createDetector({ minNumOfFailures: 0, failureRateThreshold: 0 });
      assert.equal(detector.isFaulty(), false);
      report(0, 5);
      assert.equal(detector.isFaulty(), false);
      report(1, 0);
      assert.equal(detector.isFaulty(), true);
    });
  });

  describe('errorFilter', () => {
    it('filtered errors count as traffic but not as failures', () => {
      const { detector } = createDetector({
        minNumOfFailures: 1,
        failureRateThreshold: 50,
        errorFilter: err => err.message === 'counted'
      });
      for (let i = 0; i < 9; i++) detector.onCommandResult(false, new Error('ignored'));
      assert.equal(detector.isFaulty(), false);
      // 1 counted failure of 10 outcomes = 10% < 50%
      detector.onCommandResult(false, new Error('counted'));
      assert.equal(detector.isFaulty(), false);
    });

    it('a failure without an error object always counts', () => {
      const { detector } = createDetector({ minNumOfFailures: 1, errorFilter: () => false });
      detector.onCommandResult(false);
      assert.equal(detector.isFaulty(), true);
    });
  });

  describe('defaultErrorFilter', () => {
    const reply = (message: string) => new SimpleError(message);
    const connReset = Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' });

    for (const [name, err] of [
      ['WRONGTYPE', reply('WRONGTYPE Operation against a key holding the wrong kind of value')],
      ['CROSSSLOT', reply("CROSSSLOT Keys in request don't hash to the same slot")],
      ['TRYAGAIN', reply('TRYAGAIN Multiple keys request during rehashing of slot')],
      ['OOM', reply("OOM command not allowed when used memory > 'maxmemory'.")],
      ['BUSYKEY (not BUSY)', reply('BUSYKEY Target key name already exists.')],
      ['WatchError', new WatchError()],
      ['AbortError', new AbortError()],
      ['MultiErrorReply of command errors', new MultiErrorReply([reply('WRONGTYPE x')], [0])]
    ] as const) {
      it(`ignores ${name}`, () => {
        assert.equal(defaultErrorFilter(err), false);
      });
    }

    for (const [name, err] of [
      ['LOADING', reply('LOADING Redis is loading the dataset in memory')],
      ['BUSY', reply('BUSY Redis is busy running a script.')],
      ['MASTERDOWN', reply('MASTERDOWN Link with MASTER is down')],
      ['CLUSTERDOWN', reply('CLUSTERDOWN The cluster is down')],
      ['READONLY', reply("READONLY You can't write against a read only replica.")],
      ['NOREPLICAS', reply('NOREPLICAS Not enough good replicas to write.')],
      ['MISCONF', reply('MISCONF Redis is configured to save RDB snapshots')],
      ['SocketClosedUnexpectedlyError', new SocketClosedUnexpectedlyError()],
      ['TimeoutError', new TimeoutError()],
      ['ECONNRESET', connReset],
      ['MultiErrorReply with a server-state reply', new MultiErrorReply([reply('WRONGTYPE x'), reply('LOADING y')], [0, 1])]
    ] as const) {
      it(`counts ${name}`, () => {
        assert.equal(defaultErrorFilter(err), true);
      });
    }

    it('is the detector default, and ignored errors still count as traffic', () => {
      const { detector } = createDetector({ minNumOfFailures: 1, failureRateThreshold: 50 });
      for (let i = 0; i < 3; i++) detector.onCommandResult(false, reply('WRONGTYPE x'));
      assert.equal(detector.isFaulty(), false);
      // 1 counted failure of 4 outcomes = 25% < 50%
      detector.onCommandResult(false, reply('LOADING y'));
      assert.equal(detector.isFaulty(), false);
    });
  });

  it('the default clock ignores wall-clock jumps', async () => {
    const realNow = Date.now;
    let offset = 0;
    // installed before construction, so a detector reading the wall clock sees the jump
    Date.now = () => realNow() + offset;
    try {
      const detector = new DefaultFailureDetector({ minNumOfFailures: 3, failureRateThreshold: 0, windowSize: 20 });
      detector.onCommandResult(false);
      detector.onCommandResult(false);
      // the wall clock steps back an hour (NTP correction, VM resume)
      offset = -3_600_000;
      await sleep(40);
      detector.onCommandResult(false);
      assert.equal(detector.isFaulty(), false, 'the first two failures must age out of the window');
    } finally {
      Date.now = realNow;
    }
  });

  it('reset discards all observations', () => {
    const { detector, report } = createDetector();
    report(5, 0);
    assert.equal(detector.isFaulty(), true);
    detector.reset();
    assert.equal(detector.isFaulty(), false);
  });
});
