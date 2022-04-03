import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLUSTER_GETKEYSINSLOT';

describe('CLUSTER GETKEYSINSLOT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(0, 10),
            ['CLUSTER', 'GETKEYSINSLOT', '0', '10']
        );
    });

    testUtils.testWithCluster('clusterNode.clusterGetKeysInSlot', async cluster => {
        const reply = await cluster.getSlotMaster(0).client.clusterGetKeysInSlot(0, 1);
        assert.ok(Array.isArray(reply));
        for (const item of reply) {
            assert.equal(typeof item, 'string');
        }
    }, GLOBAL.CLUSTERS.OPEN);
});
