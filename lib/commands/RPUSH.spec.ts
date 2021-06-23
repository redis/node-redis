import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './RPUSH';

describe('RPUSH', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'element'),
                ['RPUSH', 'key', 'element']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['RPUSH', 'key', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.rPush', async client => {
        assert.equal(
            await client.rPush('key', 'element'),
            1
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.rPush', async cluster => {
        assert.equal(
            await cluster.rPush('key', 'element'),
            1
        );
    });
});
