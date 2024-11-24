import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_MYSHARDID from './CLUSTER_MYSHARDID';
import { parseArgs } from './generic-transformers';

describe('CLUSTER MYSHARDID', () => {
  testUtils.isVersionGreaterThanHook([7, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_MYSHARDID),
      ['CLUSTER', 'MYSHARDID']
    );
  });

  testUtils.testWithCluster('clusterNode.clusterMyShardId', async cluster => {
    const client = await cluster.nodeClient(cluster.masters[0]);
    assert.equal(
      typeof await client.clusterMyShardId(),
      'string'
    );
  }, GLOBAL.CLUSTERS.OPEN);
});
