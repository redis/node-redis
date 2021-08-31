import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './GEODIST';

describe('GEODIST', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', '1', '2'),
                ['GEODIST', 'key', '1', '2']
            );
        });

        it('with unit', () => {
            assert.deepEqual(
                transformArguments('key', '1', '2', 'm'),
                ['GEODIST', 'key', '1', '2', 'm']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.geoDist', async client => {
        assert.equal(
            await client.geoDist('key', '1', '2'),
            null
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.geoDist', async cluster => {
        assert.equal(
            await cluster.geoDist('key', '1', '2'),
            null
        );
    });
});
