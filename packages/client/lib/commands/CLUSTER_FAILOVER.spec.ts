import { strict as assert } from 'node:assert';
import CLUSTER_FAILOVER, { FAILOVER_MODES } from './CLUSTER_FAILOVER';

describe('CLUSTER FAILOVER', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        CLUSTER_FAILOVER.transformArguments(),
        ['CLUSTER', 'FAILOVER']
      );
    });

    it('with mode', () => {
      assert.deepEqual(
        CLUSTER_FAILOVER.transformArguments({
          mode: FAILOVER_MODES.FORCE
        }),
        ['CLUSTER', 'FAILOVER', 'FORCE']
      );
    });
  });
});
