import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './SETEX';

describe('SETEX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1, 'value'),
            ['SETEX', 'key', '1', 'value']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.setEx', async client => {
        assert.equal(
            await client.setEx('key', 1, 'value'),
            'OK'
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.setEx', async cluster => {
        assert.equal(
            await cluster.setEx('key', 1, 'value'),
            'OK'
        );
    });
});
