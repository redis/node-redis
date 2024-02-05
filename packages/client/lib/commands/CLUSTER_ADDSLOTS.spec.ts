import { strict as assert } from 'node:assert';
import CLUSTER_ADDSLOTS from './CLUSTER_ADDSLOTS';

describe('CLUSTER ADDSLOTS', () => {
  describe('transformArguments', () => {
    it('single', () => {
      assert.deepEqual(
        CLUSTER_ADDSLOTS.transformArguments(0),
        ['CLUSTER', 'ADDSLOTS', '0']
      );
    });

    it('multiple', () => {
      assert.deepEqual(
        CLUSTER_ADDSLOTS.transformArguments([0, 1]),
        ['CLUSTER', 'ADDSLOTS', '0', '1']
      );
    });
  });
});
