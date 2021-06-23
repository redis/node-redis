import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './LLEN';

describe('LLEN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['LLEN', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.lLen', async client => {
        assert.equal(
            await client.lLen('key'),
            0
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lLen', async cluster => {
        assert.equal(
            await cluster.lLen('key'),
            0
        );
    });
});
