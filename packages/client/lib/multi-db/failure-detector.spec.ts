import { strict as assert } from 'node:assert';
import { DefaultFailureDetector } from './failure-detector';

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

  it('reset discards all observations', () => {
    const { detector, report } = createDetector();
    report(5, 0);
    assert.equal(detector.isFaulty(), true);
    detector.reset();
    assert.equal(detector.isFaulty(), false);
  });
});
