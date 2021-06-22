import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';

describe('PING', () => {
    itWithClient(TestRedisServers.OPEN, 'client.ping', async client => {
        assert.equal(
            await client.ping(),
            'PONG'
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.ping', async cluster => {
        assert.equal(
            await cluster.ping(),
            'PONG'
        );
    });
});
