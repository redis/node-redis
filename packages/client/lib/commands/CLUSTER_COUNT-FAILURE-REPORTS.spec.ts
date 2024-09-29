import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLUSTER_COUNT-FAILURE-REPORTS';

describe('CLUSTER COUNT-FAILURE-REPORTS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('0'),
            ['CLUSTER', 'COUNT-FAILURE-REPORTS', '0']
        );
    });

    testUtils.testWithCluster('clusterNode.clusterCountFailureReports', async cluster => {
        const client = await cluster.nodeClient(cluster.masters[0]);
        assert.equal(
            typeof await client.clusterCountFailureReports(
                await client.clusterMyId()
            ),
            'number'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
