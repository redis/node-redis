import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './LMOVE';

describe('LMOVE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('source', 'destination', 'LEFT', 'RIGHT'),
            ['LMOVE', 'source', 'destination', 'LEFT', 'RIGHT']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.lMove', async client => {
        assert.equal(
            await client.lMove('source', 'destination', 'LEFT', 'RIGHT'),
            null
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lMove', async cluster => {
        assert.equal(
            await cluster.lMove('{tag}source', '{tag}destination', 'LEFT', 'RIGHT'),
            null
        );
    });
});
