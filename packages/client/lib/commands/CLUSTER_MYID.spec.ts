import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_MYID from './CLUSTER_MYID';
import { parseArgs } from './generic-transformers';

describe('CLUSTER MYID', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_MYID),
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
