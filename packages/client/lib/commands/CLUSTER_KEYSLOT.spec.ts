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
        assert.equal(
            typeof await cluster.getSlotMaster(0).client.clusterKeySlot('key'),
            'number'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
