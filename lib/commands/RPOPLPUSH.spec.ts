import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './RPOPLPUSH';

describe('RPOPLPUSH', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('source', 'destination'),
            ['RPOPLPUSH', 'source', 'destination']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.rPopLPush', async client => {
        assert.equal(
            await client.rPopLPush('source', 'destination'),
            null
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.rPopLPush', async cluster => {
        assert.equal(
            await cluster.rPopLPush('{tag}source', '{tag}destination'),
            null
        );
    });
});
