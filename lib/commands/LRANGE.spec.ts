
import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './LRANGE';

describe('LRANGE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, -1),
            ['LRANGE', 'key', '0', '-1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.lRange', async client => {
        assert.deepEqual(
            await client.lRange('key', 0, -1),
            []
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lRange', async cluster => {
        assert.deepEqual(
            await cluster.lRange('key', 0, -1),
            []
        );
    });
});
