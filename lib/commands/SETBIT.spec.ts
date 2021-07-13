import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './SETBIT';

describe('SETBIT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 1),
            ['SETBIT', 'key', '0', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.setBit', async client => {
        assert.equal(
            await client.setBit('key', 0, 1),
            0
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.setBit', async cluster => {
        assert.equal(
            await cluster.setBit('key', 0, 1),
            0
        );
    });
});
