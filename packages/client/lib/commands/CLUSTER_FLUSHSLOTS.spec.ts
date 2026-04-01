import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_FLUSHSLOTS from './CLUSTER_FLUSHSLOTS';
import { parseArgs } from './generic-transformers';

describe('CLUSTER FLUSHSLOTS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_FLUSHSLOTS),
      ['CLUSTER', 'FLUSHSLOTS']
    );
  });

  // TODO: re-enable once cluster CI flakiness is resolved
  // testUtils.testWithCluster('clusterNode.clusterFlushSlots', async cluster => {
  //   const client = await cluster.nodeClient(cluster.masters[0]);
  //   assert.equal(
  //     await client.clusterFlushSlots(),
  //     'OK'
  //   );
  // }, GLOBAL.CLUSTERS.OPEN);
});
