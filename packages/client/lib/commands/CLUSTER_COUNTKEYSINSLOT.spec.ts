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

    testUtils.testWithClient('cluster.clusterInfo', async cluster => {
        assert.equal(
            typeof await cluster.clusterInfo(),
            'number'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
