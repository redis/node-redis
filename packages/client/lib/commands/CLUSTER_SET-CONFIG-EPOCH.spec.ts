import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLUSTER_SET-CONFIG-EPOCH';

describe('CLUSTER SET-CONFIG-EPOCH', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(0),
            ['CLUSTER', 'SET-CONFIG-EPOCH', '0']
        );
    });

    testUtils.testWithCluster('cluster.clusterSetConfigEpoch', async cluster => {
        try {
            assert.equal(
                await cluster.clusterSetConfigEpoch(1),
                'OK'
            );
        } catch (ReplyError) {
            //?
        }
    }, GLOBAL.CLUSTERS.OPEN);
});
