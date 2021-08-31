import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './MGET';

describe('MGET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(['1', '2']),
            ['MGET', '1', '2']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.mGet', async client => {
        assert.deepEqual(
            await client.mGet(['key']),
            [null]
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.mGet', async cluster => {
        assert.deepEqual(
            await cluster.mGet(['key']),
            [null]
        );
    });
});
