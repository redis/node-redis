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
        const [master] = cluster.masters,
            client = await cluster.nodeClient(master);
        assert.equal(
            await client.clusterMyId(),
            master.id
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
