import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './CLUSTER_INFO';

describe('CLUSTER INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      transformArguments(),
      ['CLUSTER', 'INFO']
    );
  });

  testUtils.testWithCluster('clusterNode.clusterInfo', async cluster => {
    const client = await cluster.nodeClient(cluster.masters[0]);
    assert.equal(
      typeof await client.clusterInfo(),
      'string'
    );
  }, GLOBAL.CLUSTERS.OPEN);
});
