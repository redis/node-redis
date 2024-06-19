import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_KEYSLOT from './CLUSTER_KEYSLOT';
import { parseArgs } from './generic-transformers';

describe('CLUSTER KEYSLOT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_KEYSLOT, 'key'),
      ['CLUSTER', 'KEYSLOT', 'key']
    );
  });

  testUtils.testWithCluster('clusterNode.clusterKeySlot', async cluster => {
    const client = await cluster.nodeClient(cluster.masters[0]);
    assert.equal(
      typeof await client.clusterKeySlot('key'),
      'number'
    );
  }, GLOBAL.CLUSTERS.OPEN);
});
