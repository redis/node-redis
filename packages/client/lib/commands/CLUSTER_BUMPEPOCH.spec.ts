import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_BUMPEPOCH from './CLUSTER_BUMPEPOCH';
import { parseArgs } from './generic-transformers';

describe('CLUSTER BUMPEPOCH', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_BUMPEPOCH),
      ['CLUSTER', 'BUMPEPOCH']
    );
  });

  testUtils.testWithCluster('clusterNode.clusterBumpEpoch', async cluster => {
    const client = await cluster.nodeClient(cluster.masters[0]);
    assert.equal(
      typeof await client.clusterBumpEpoch(),
      'string'
    );
  }, GLOBAL.SERVERS.OPEN);
});
