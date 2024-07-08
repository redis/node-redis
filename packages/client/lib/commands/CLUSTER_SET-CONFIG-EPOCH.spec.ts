import { strict as assert } from 'node:assert';
import CLUSTER_SET_CONFIG_EPOCH from './CLUSTER_SET-CONFIG-EPOCH';
import { parseArgs } from './generic-transformers';

describe('CLUSTER SET-CONFIG-EPOCH', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_SET_CONFIG_EPOCH, 0),
      ['CLUSTER', 'SET-CONFIG-EPOCH', '0']
    );
  });
});
