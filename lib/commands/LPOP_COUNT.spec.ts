import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './LPOP_COUNT';

describe('LPOP COUNT', () => {
    describeHandleMinimumRedisVersion([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['LPOP', 'key', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.lPopCount', async client => {
        assert.equal(
            await client.lPopCount('key', 1),
            null
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lPop', async cluster => {
        assert.equal(
            await cluster.lPopCount('key', 1),
            null
        );
    });
});
