import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_LINKS from './CLUSTER_LINKS';
import { parseArgs } from './generic-transformers';

describe('CLUSTER LINKS', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_LINKS),
      ['CLUSTER', 'LINKS']
    );
  });

  testUtils.testWithCluster('clusterNode.clusterLinks', async cluster => {
    const client = await cluster.nodeClient(cluster.masters[0]),
      links = await client.clusterLinks();
    assert.ok(Array.isArray(links));
    for (const link of links) {
      assert.equal(typeof link.direction, 'string');
      assert.equal(typeof link.node, 'string');
      assert.equal(typeof link['create-time'], 'number');
      assert.equal(typeof link.events, 'string');
      assert.equal(typeof link['send-buffer-allocated'], 'number');
      assert.equal(typeof link['send-buffer-used'], 'number');
    }
  }, GLOBAL.CLUSTERS.OPEN);
});
