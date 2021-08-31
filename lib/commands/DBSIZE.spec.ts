import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './DBSIZE';

describe('DBSIZE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['DBSIZE']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.dbSize', async client => {
        assert.equal(
            await client.dbSize(),
            0
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.dbSize', async cluster => {
        assert.equal(
            await cluster.dbSize(),
            0
        );
    });
});
