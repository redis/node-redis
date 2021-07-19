import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './GEODIST';

describe('GEODIST', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', '1', '2'),
            ['GEODIST', 'key', '1', '2']
        );
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
