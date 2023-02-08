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
        const client = await cluster.nodeClient(cluster.masters[0]);
        assert.equal(
            typeof await client.clusterCountKeysInSlot(0),
            'number'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
