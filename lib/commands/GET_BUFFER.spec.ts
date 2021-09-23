import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';

describe('GET_BUFFER', () => {
    itWithClient(TestRedisServers.OPEN, 'client.getBuffer', async client => {
        const buffer = Buffer.from('string');
        await client.set('key', buffer);
        assert.deepEqual(
            buffer,
            await client.getBuffer('key')
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.getBuffer', async cluster => {
        const buffer = Buffer.from('string');
        await cluster.set('key', buffer);
        assert.deepEqual(
            buffer,
            await cluster.getBuffer('key')
        );
    });
});
