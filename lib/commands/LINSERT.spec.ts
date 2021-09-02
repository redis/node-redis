import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './LINSERT';

describe('LINSERT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'BEFORE', 'pivot', 'element'),
            ['LINSERT', 'key', 'BEFORE', 'pivot', 'element']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.lInsert', async client => {
        assert.equal(
            await client.lInsert('key', 'BEFORE', 'pivot', 'element'),
            0
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lLen', async cluster => {
        assert.equal(
            await cluster.lInsert('key', 'BEFORE', 'pivot', 'element'),
            0
        );
    });
});
