import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLUSTER_COUNT-FAILURE-REPORTS';

describe.only('CLUSTER COUNT-FAILURE-REPORTS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('1'),
            ['CLUSTER', 'COUNT-FAILURE-REPORTS', '1']
        );
    });

    testUtils.testWithCluster('cluster.clusterCountFailureReports', async cluster => {
        const id: string = await cluster.clusterMyId();
        assert.equal(
            await cluster.clusterCountFailureReports(id),
            0
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
