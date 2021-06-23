import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './RPOP_COUNT';

describe('RPOP COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['RPOP', 'key', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.rPopCount', async client => {
        assert.equal(
            await client.rPopCount('key', 1),
            null
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.rPopCount', async cluster => {
        assert.equal(
            await cluster.rPopCount('key', 1),
            null
        );
    });
});
