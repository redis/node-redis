import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_INFO from './CLUSTER_INFO';
import { parseArgs } from './generic-transformers';

describe('CLUSTER INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_INFO),
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
