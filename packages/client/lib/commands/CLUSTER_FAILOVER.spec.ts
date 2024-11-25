import { strict as assert } from 'node:assert';
import CLUSTER_FAILOVER, { FAILOVER_MODES } from './CLUSTER_FAILOVER';
import { parseArgs } from './generic-transformers';

describe('CLUSTER FAILOVER', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_FAILOVER),
        ['CLUSTER', 'FAILOVER']
      );
    });

    it('with mode', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_FAILOVER, {
          mode: FAILOVER_MODES.FORCE
        }),
        ['CLUSTER', 'FAILOVER', 'FORCE']
      );
    });
  });
});
