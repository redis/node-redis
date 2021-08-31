import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './SETNX';

describe('SETNX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'value'),
            ['SETNX', 'key', 'value']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.setNX', async client => {
        assert.equal(
            await client.setNX('key', 'value'),
            true
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.setNX', async cluster => {
        assert.equal(
            await cluster.setNX('key', 'value'),
            true
        );
    });
});
