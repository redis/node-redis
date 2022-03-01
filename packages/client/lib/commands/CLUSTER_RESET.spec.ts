import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLUSTER_RESET';

describe.only('CLUSTER RESET', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['CLUSTER', 'RESET']
            );
        });

        it('HARD', () => {
            assert.deepEqual(
                transformArguments('HARD'),
                ['CLUSTER', 'RESET', 'HARD']
            );
        });

        it('SOFT', () => {
            assert.deepEqual(
                transformArguments('SOFT'),
                ['CLUSTER', 'RESET', 'SOFT']
            );
        });
    });

    testUtils.testWithCluster('cluster.clusterReset', async cluster => {
        assert.equal(
            await cluster.clusterReset('SOFT'),
            'OK'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
