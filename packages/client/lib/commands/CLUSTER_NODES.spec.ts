import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_NODES from './CLUSTER_NODES';

describe('CLUSTER NODES', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CLUSTER_NODES.transformArguments(),
      ['CLUSTER', 'NODES']
    );
  });

  testUtils.testWithCluster('clusterNode.clusterNodes', async cluster => {
    const client = await cluster.nodeClient(cluster.masters[0]);
    assert.equal(
      typeof await client.clusterNodes(),
      'string'
    );
  }, GLOBAL.CLUSTERS.OPEN);
});
