import { strict as assert } from 'node:assert';
import CLUSTER_SET_CONFIG_EPOCH from './CLUSTER_SET-CONFIG-EPOCH';

describe('CLUSTER SET-CONFIG-EPOCH', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CLUSTER_SET_CONFIG_EPOCH.transformArguments(0),
      ['CLUSTER', 'SET-CONFIG-EPOCH', '0']
    );
  });
});
