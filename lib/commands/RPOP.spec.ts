import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './RPOP';

describe('RPOP', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['RPOP', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.rPop', async client => {
        assert.equal(
            await client.rPop('key'),
            null
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.rPop', async cluster => {
        assert.equal(
            await cluster.rPop('key'),
            null
        );
    });
});
