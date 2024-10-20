import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_COUNTKEYSINSLOT from './CLUSTER_COUNTKEYSINSLOT';
import { parseArgs } from './generic-transformers';

describe('CLUSTER COUNTKEYSINSLOT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_COUNTKEYSINSLOT, 0),
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
