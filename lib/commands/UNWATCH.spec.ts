import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './UNWATCH';

describe('UNWATCH', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['UNWATCH']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.unwatch', async client => {
        assert.equal(
            await client.unwatch(),
            'OK'
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.unwatch', async cluster => {
        assert.equal(
            await cluster.unwatch(),
            'OK'
        );
    });
});
