import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_SLOTS from './CLUSTER_SLOTS';
import { parseArgs } from './generic-transformers';

describe('CLUSTER SLOTS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_SLOTS),
      ['CLUSTER', 'SLOTS']
    );
  });

  testUtils.testWithCluster('clusterNode.clusterSlots', async cluster => {
    const client = await cluster.nodeClient(cluster.masters[0]),
      slots = await client.clusterSlots();
    assert.ok(Array.isArray(slots));
    for (const { from, to, master, replicas } of slots) {
      assert.equal(typeof from, 'number');
      assert.equal(typeof to, 'number');
      assert.equal(typeof master.host, 'string');
      assert.equal(typeof master.port, 'number');
      assert.equal(typeof master.id, 'string');
      for (const replica of replicas) {
        assert.equal(typeof replica.host, 'string');
        assert.equal(typeof replica.port, 'number');
        assert.equal(typeof replica.id, 'string');
      }
    }
  }, GLOBAL.CLUSTERS.WITH_REPLICAS);
});
