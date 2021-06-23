import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './RPUSHX';

describe('RPUSHX', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'element'),
                ['RPUSHX', 'key', 'element']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['RPUSHX', 'key', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.rPushX', async client => {
        assert.equal(
            await client.rPushX('key', 'element'),
            0
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.rPushX', async cluster => {
        assert.equal(
            await cluster.rPushX('key', 'element'),
            0
        );
    });
});
