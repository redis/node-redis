import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './LPOP';

describe('LPOP', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['LPOP', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.lPop', async client => {
        assert.equal(
            await client.lPop('key'),
            null
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lPop', async cluster => {
        assert.equal(
            await cluster.lPop('key'),
            null
        );
    });
});
