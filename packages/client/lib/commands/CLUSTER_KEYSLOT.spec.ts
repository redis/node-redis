import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLUSTER_KEYSLOT';

describe('CLUSTER KEYSLOT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['CLUSTER', 'KEYSLOT', 'key']
        );
    });

    testUtils.testWithCluster('clusterNode.clusterKeySlot', async cluster => {
        const client = await cluster.nodeClient(cluster.masters[0]);
        assert.equal(
            typeof await client.clusterKeySlot('key'),
            'number'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
