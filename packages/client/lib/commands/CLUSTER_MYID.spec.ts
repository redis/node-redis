import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLUSTER_MYID';

describe('CLUSTER MYID', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLUSTER', 'MYID']
        );
    });

    testUtils.testWithCluster('clusterNode.clusterMyId', async cluster => {
        assert.notEqual(
            await cluster.getSlotMaster(0).client.clusterMyId(),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
