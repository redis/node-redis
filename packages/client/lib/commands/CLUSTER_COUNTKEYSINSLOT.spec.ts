import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_COUNTKEYSINSLOT from './CLUSTER_COUNTKEYSINSLOT';

describe('CLUSTER COUNTKEYSINSLOT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CLUSTER_COUNTKEYSINSLOT.transformArguments(0),
      ['CLUSTER', 'COUNTKEYSINSLOT', '0']
    );
  });

  testUtils.testWithCluster('clusterNode.clusterCountKeysInSlot', async cluster => {
    const client = await cluster.nodeClient(cluster.masters[0]);
    assert.equal(
      typeof await client.clusterCountKeysInSlot(0),
      'number'
    );
  }, GLOBAL.CLUSTERS.OPEN);
});
