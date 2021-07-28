import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './GETSET';

describe('GETSET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'value'),
            ['GETSET', 'key', 'value']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.getSet', async client => {
        assert.equal(
            await client.getSet('key', 'value'),
            null
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.getSet', async cluster => {
        assert.equal(
            await cluster.getSet('key', 'value'),
            null
        );
    });
});
