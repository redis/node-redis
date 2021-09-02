import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './LPUSH';

describe('LPUSH', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'field'),
                ['LPUSH', 'key', 'field']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['LPUSH', 'key', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.lPush', async client => {
        assert.equal(
            await client.lPush('key', 'field'),
            1
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lPush', async cluster => {
        assert.equal(
            await cluster.lPush('key', 'field'),
            1
        );
    });
});
