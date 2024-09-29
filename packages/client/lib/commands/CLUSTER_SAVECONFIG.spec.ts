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
        const client = await cluster.nodeClient(cluster.masters[0]);
        assert.equal(
            await client.clusterSaveConfig(),
            'OK'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
