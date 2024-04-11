import { strict as assert } from 'node:assert';
import CLUSTER_DELSLOTS from './CLUSTER_DELSLOTS';

describe('CLUSTER DELSLOTS', () => {
  describe('transformArguments', () => {
    it('single', () => {
      assert.deepEqual(
        CLUSTER_DELSLOTS.transformArguments(0),
        ['CLUSTER', 'DELSLOTS', '0']
      );
    });

    it('multiple', () => {
      assert.deepEqual(
        CLUSTER_DELSLOTS.transformArguments([0, 1]),
        ['CLUSTER', 'DELSLOTS', '0', '1']
      );
    });
  });
});
