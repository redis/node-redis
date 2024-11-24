import { strict as assert } from 'node:assert';
import CLUSTER_ADDSLOTS from './CLUSTER_ADDSLOTS';
import { parseArgs } from './generic-transformers';

describe('CLUSTER ADDSLOTS', () => {
  describe('transformArguments', () => {
    it('single', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_ADDSLOTS, 0),
        ['CLUSTER', 'ADDSLOTS', '0']
      );
    });

    it('multiple', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_ADDSLOTS, [0, 1]),
        ['CLUSTER', 'ADDSLOTS', '0', '1']
      );
    });
  });
});
