import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_GETKEYSINSLOT from './CLUSTER_GETKEYSINSLOT';
import { parseArgs } from './generic-transformers';

describe('CLUSTER GETKEYSINSLOT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_GETKEYSINSLOT, 0, 10),
      ['CLUSTER', 'GETKEYSINSLOT', '0', '10']
    );
  });

  testUtils.testWithCluster('clusterNode.clusterGetKeysInSlot', async cluster => {
    const slot = 12539, // "key" slot
      client = await cluster.nodeClient(cluster.slots[slot].master),
      [, reply] = await Promise.all([  
        client.set('key', 'value'),
        client.clusterGetKeysInSlot(slot, 1),
      ])
    assert.ok(Array.isArray(reply));
    for (const item of reply) {
      assert.equal(typeof item, 'string');
    }
  }, GLOBAL.CLUSTERS.OPEN);
});
