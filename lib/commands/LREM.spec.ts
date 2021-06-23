
import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './LREM';

describe('LREM', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 'element'),
            ['LREM', 'key', '0', 'element']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.lRem', async client => {
        assert.equal(
            await client.lRem('key', 0, 'element'),
            0
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lRem', async cluster => {
        assert.equal(
            await cluster.lRem('key', 0, 'element'),
            0
        );
    });
});
