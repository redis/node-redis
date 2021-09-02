import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './BITOP';

describe('BITOP', () => {
    describe('transformArguments', () => {
        it('single key', () => {
            assert.deepEqual(
                transformArguments('AND', 'destKey', 'key'),
                ['BITOP', 'AND', 'destKey', 'key']
            );
        });

        it('multiple keys', () => {
            assert.deepEqual(
                transformArguments('AND', 'destKey', ['1', '2']),
                ['BITOP', 'AND', 'destKey', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.bitOp', async client => {
        assert.equal(
            await client.bitOp('AND', 'destKey', 'key'),
            0
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.bitOp', async cluster => {
        assert.equal(
            await cluster.bitOp('AND', '{tag}destKey', '{tag}key'),
            0
        );
    });
});
