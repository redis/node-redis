import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLUSTER_COUNTKEYSINSLOT';

describe('CLUSTER COUNTKEYSINSLOT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(0),
            ['CLUSTER', 'COUNTKEYSINSLOT', '0']
        );
    });

    testUtils.testWithCluster('clusterNode.clusterCountKeysInSlot', async cluster => {
        assert.equal(
            typeof await cluster.getSlotMaster(0).client.clusterCountKeysInSlot(0),
            'number'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
