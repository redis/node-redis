import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './GETBIT';

describe('GETBIT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0),
            ['GETBIT', 'key', '0']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.getBit', async client => {
        assert.equal(
            await client.getBit('key', 0),
            0
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.getBit', async cluster => {
        assert.equal(
            await cluster.getBit('key', 0),
            0
        );
    });
});
