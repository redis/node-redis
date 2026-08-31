import { strict as assert } from 'node:assert';
import { resolveMultiDbConfig, MULTI_DB_DEFAULTS } from './config';
import type { FailureDetector } from './failure-detector';

describe('resolveMultiDbConfig', () => {
  const DB = { options: {} };

  describe('defaults', () => {
    it('applies the full defaults table', () => {
      const { config } = resolveMultiDbConfig([DB]);
      assert.equal(config.gracePeriod, 60_000);
      assert.deepEqual(config.healthCheck, {
        interval: 5_000,
        timeout: 3_000,
        numProbes: 3,
        delayBetweenProbes: 500,
        policy: 'ALL'
      });
      assert.equal(config.maxFailoverAttempts, 10);
      assert.equal(config.delayBetweenFailoverAttempts, 12_000);
      assert.equal(config.autoFallbackInterval, -1);
      assert.equal(config.initialAvailability, 'majority');
      assert.equal(config.healthChecks, undefined);
      assert.equal(config.failoverStrategy, undefined);
    });

    it('applies default failure detector thresholds with an all-errors filter', () => {
      const { config } = resolveMultiDbConfig([DB]);
      assert.ok(!('isFaulty' in config.failureDetector));
      const detector = config.failureDetector as Exclude<typeof config.failureDetector, FailureDetector>;
      assert.equal(detector.minNumOfFailures, 1_000);
      assert.equal(detector.failureRateThreshold, 10);
      assert.equal(detector.windowSize, 2_000);
      assert.equal(detector.errorFilter(new Error('any')), true);
    });

    it('fills database identity: generated ids, weight 1, no skipped initial check', () => {
      const { databases } = resolveMultiDbConfig([DB, DB, DB]);
      assert.deepEqual(databases.map(db => db.id), ['db-0', 'db-1', 'db-2']);
      assert.deepEqual(databases.map(db => db.weight), [1, 1, 1]);
      assert.deepEqual(databases.map(db => db.skipInitialHealthCheck), [false, false, false]);
    });

    it('preserves user-provided ids, weights and options', () => {
      const options = { url: 'redis://localhost:6379' };
      const { databases } = resolveMultiDbConfig([
        { id: 'primary', options, weight: 0.75, skipInitialHealthCheck: true },
        DB
      ]);
      assert.equal(databases[0].id, 'primary');
      assert.equal(databases[0].weight, 0.75);
      assert.equal(databases[0].skipInitialHealthCheck, true);
      assert.equal(databases[0].options, options);
      assert.equal(databases[1].id, 'db-1');
    });

    it('merges partial healthCheck overrides with defaults', () => {
      const { config } = resolveMultiDbConfig([DB], { healthCheck: { interval: 10_000, numProbes: 5 } });
      assert.deepEqual(config.healthCheck, {
        interval: 10_000,
        timeout: 3_000,
        numProbes: 5,
        delayBetweenProbes: 500,
        policy: 'ALL'
      });
    });

    it('merges partial failure detector thresholds with defaults', () => {
      const errorFilter = () => false;
      const { config } = resolveMultiDbConfig([DB], {
        failureDetector: { minNumOfFailures: 2, errorFilter }
      });
      const detector = config.failureDetector as Exclude<typeof config.failureDetector, FailureDetector>;
      assert.equal(detector.minNumOfFailures, 2);
      assert.equal(detector.failureRateThreshold, 10);
      assert.equal(detector.windowSize, 2_000);
      assert.equal(detector.errorFilter, errorFilter);
    });

    it('passes a custom failure detector instance through untouched', () => {
      const custom: FailureDetector = {
        onCommandResult() {},
        isFaulty: () => false,
        reset() {}
      };
      const { config } = resolveMultiDbConfig([DB], { failureDetector: custom });
      assert.equal(config.failureDetector, custom);
    });
  });

  describe('validation', () => {
    it('requires at least one database', () => {
      assert.throws(() => resolveMultiDbConfig([]), /at least one database/);
    });

    it('rejects weights outside [0, 1]', () => {
      assert.throws(() => resolveMultiDbConfig([{ ...DB, weight: -0.1 }]), /weight/);
      assert.throws(() => resolveMultiDbConfig([{ ...DB, weight: 1.1 }]), /weight/);
      assert.throws(() => resolveMultiDbConfig([{ ...DB, weight: NaN }]), /weight/);
    });

    it('accepts the boundary weights 0 and 1', () => {
      const { databases } = resolveMultiDbConfig([
        { ...DB, weight: 0 },
        { ...DB, weight: 1 }
      ]);
      assert.deepEqual(databases.map(db => db.weight), [0, 1]);
    });

    it('rejects duplicate ids', () => {
      assert.throws(
        () => resolveMultiDbConfig([{ ...DB, id: 'a' }, { ...DB, id: 'a' }]),
        /duplicate database id "a"/
      );
    });

    it('rejects a user id colliding with a generated id', () => {
      assert.throws(
        () => resolveMultiDbConfig([{ ...DB, id: 'db-1' }, DB]),
        /duplicate database id "db-1"/
      );
    });

    it('requires healthCheck.timeout below healthCheck.interval', () => {
      assert.throws(
        () => resolveMultiDbConfig([DB], { healthCheck: { interval: 1000, timeout: 1000 } }),
        /timeout.*must be less than/
      );
    });

    it('rejects non-positive or non-integer probe knobs', () => {
      assert.throws(() => resolveMultiDbConfig([DB], { healthCheck: { numProbes: 0 } }), /numProbes/);
      assert.throws(() => resolveMultiDbConfig([DB], { healthCheck: { numProbes: 1.5 } }), /numProbes/);
      assert.throws(() => resolveMultiDbConfig([DB], { healthCheck: { timeout: 0 } }), /timeout/);
      assert.throws(() => resolveMultiDbConfig([DB], { healthCheck: { delayBetweenProbes: -1 } }), /delayBetweenProbes/);
    });

    it('rejects an empty healthChecks chain', () => {
      assert.throws(() => resolveMultiDbConfig([DB], { healthChecks: [] }), /healthChecks must not be empty/);
    });
  });

  it('pins the defaults table', () => {
    assert.deepEqual(MULTI_DB_DEFAULTS, {
      gracePeriod: 60_000,
      healthCheck: {
        interval: 5_000,
        timeout: 3_000,
        numProbes: 3,
        delayBetweenProbes: 500,
        policy: 'ALL'
      },
      failureDetector: {
        minNumOfFailures: 1_000,
        failureRateThreshold: 10,
        windowSize: 2_000
      },
      maxFailoverAttempts: 10,
      delayBetweenFailoverAttempts: 12_000,
      autoFallbackInterval: -1,
      initialAvailability: 'majority'
    });
  });
});
