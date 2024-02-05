import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_MYID from './CLUSTER_MYID';

describe('CLUSTER MYID', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CLUSTER_MYID.transformArguments(),
      ['CLUSTER', 'MYID']
    );
  });

  testUtils.testWithCluster('clusterNode.clusterMyId', async cluster => {
    const [master] = cluster.masters,
      client = await cluster.nodeClient(master);
    assert.equal(
      await client.clusterMyId(),
      master.id
    );
  }, GLOBAL.CLUSTERS.OPEN);
});
