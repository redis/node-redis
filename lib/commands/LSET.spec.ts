import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './LSET';

describe('LSET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 'element'),
            ['LSET', 'key', '0', 'element']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.lSet', async client => {
        await client.lPush('key', 'element');
        assert.equal(
            await client.lSet('key', 0, 'element'),
            'OK'
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lSet', async cluster => {
        await cluster.lPush('key', 'element');
        assert.equal(
            await cluster.lSet('key', 0, 'element'),
            'OK'
        );
    });
});
