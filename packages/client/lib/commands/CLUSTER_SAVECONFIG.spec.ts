import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLUSTER_SAVECONFIG';

describe('CLUSTER SAVECONFIG', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLUSTER', 'SAVECONFIG']
        );
    });

    testUtils.testWithCluster('clusterNode.clusterSaveConfig', async cluster => {
        assert.equal(
            await cluster.getSlotMaster(0).client.clusterSaveConfig(),
            'OK'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
