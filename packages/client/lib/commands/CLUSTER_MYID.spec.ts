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

    testUtils.testWithClient('cluster.clusterMyId', async cluster => {
        assert.notEqual(
            await cluster.clusterMyId(),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
