import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_SAVECONFIG from './CLUSTER_SAVECONFIG';

describe('CLUSTER SAVECONFIG', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CLUSTER_SAVECONFIG.transformArguments(),
      ['CLUSTER', 'SAVECONFIG']
    );
  });

  testUtils.testWithCluster('clusterNode.clusterSaveConfig', async cluster => {
    const client = await cluster.nodeClient(cluster.masters[0]);
    assert.equal(
      await client.clusterSaveConfig(),
      'OK'
    );
  }, GLOBAL.CLUSTERS.OPEN);
});
