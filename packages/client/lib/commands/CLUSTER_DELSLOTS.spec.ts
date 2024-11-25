import { strict as assert } from 'node:assert';
import CLUSTER_DELSLOTS from './CLUSTER_DELSLOTS';
import { parseArgs } from './generic-transformers';

describe('CLUSTER DELSLOTS', () => {
  describe('transformArguments', () => {
    it('single', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_DELSLOTS, 0),
        ['CLUSTER', 'DELSLOTS', '0']
      );
    });

    it('multiple', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_DELSLOTS, [0, 1]),
        ['CLUSTER', 'DELSLOTS', '0', '1']
      );
    });
  });
});
