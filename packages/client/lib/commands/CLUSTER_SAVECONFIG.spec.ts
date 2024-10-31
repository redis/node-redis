import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_SAVECONFIG from './CLUSTER_SAVECONFIG';
import { parseArgs } from './generic-transformers';

describe('CLUSTER SAVECONFIG', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_SAVECONFIG),
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
