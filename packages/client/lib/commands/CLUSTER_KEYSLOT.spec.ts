import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_KEYSLOT from './CLUSTER_KEYSLOT';
import { parseArgs } from './generic-transformers';
import { BasicCommandParser } from '../client/parser';

describe('CLUSTER KEYSLOT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_KEYSLOT, 'key'),
      ['CLUSTER', 'KEYSLOT', 'key']
    );
  });

  it('applies keyPrefix to the reported key', () => {
    const parser = new BasicCommandParser('prefix:');
    CLUSTER_KEYSLOT.parseCommand(parser, 'key');
    assert.deepEqual(parser.redisArgs, ['CLUSTER', 'KEYSLOT', 'prefix:key']);
  });

  testUtils.testWithCluster('clusterNode.clusterKeySlot', async cluster => {
    const client = await cluster.nodeClient(cluster.masters[0]);
    assert.equal(
      typeof await client.clusterKeySlot('key'),
      'number'
    );
  }, GLOBAL.CLUSTERS.OPEN);
});
