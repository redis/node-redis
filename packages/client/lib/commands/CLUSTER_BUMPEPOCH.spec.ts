import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLUSTER_BUMPEPOCH';

describe('CLUSTER BUMPEPOCH', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLUSTER', 'BUMPEPOCH']
        );
    });

    testUtils.testWithCluster('cluster.clusterBumpEpoch', async cluster => {
        assert.equal(
            typeof await cluster.clusterBumpEpoch(),
            'string'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
