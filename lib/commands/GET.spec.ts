import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './GET';

describe('GET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['GET', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.get', async client => {
        assert.equal(
            await client.get('key'),
            null
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.get', async cluster => {
        assert.equal(
            await cluster.get('key'),
            null
        );
    });
});
