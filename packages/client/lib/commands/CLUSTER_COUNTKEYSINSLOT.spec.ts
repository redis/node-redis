import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLUSTER_COUNTKEYSINSLOT';

describe('CLUSTER COUNTKEYSINSLOT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(1),
            ['CLUSTER', 'COUNTKEYSINSLOT', '1']
        );
    });

    testUtils.testWithCluster('clusterNode.clusterInfo', async cluster => {
        assert.equal(
            typeof await cluster.getSlotMaster(0).client.clusterCountKeysInSlot(1),
            'number'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
