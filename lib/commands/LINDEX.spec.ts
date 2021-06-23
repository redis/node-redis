import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './LINDEX';

describe('LINDEX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'element'),
            ['LINDEX', 'key', 'element']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.lIndex', async client => {
        assert.equal(
            await client.lIndex('key', 'element'),
            null
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lIndex', async cluster => {
        assert.equal(
            await cluster.lIndex('key', 'element'),
            null
        );
    });
});
