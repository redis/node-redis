import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './BITPOS';

describe('BITPOS', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 1),
                ['BITPOS', 'key', '1']
            );
        });

        it('with start', () => {
            assert.deepEqual(
                transformArguments('key', 1, 1),
                ['BITPOS', 'key', '1', '1']
            );
        });

        it('with start, end', () => {
            assert.deepEqual(
                transformArguments('key', 1, 1, -1),
                ['BITPOS', 'key', '1', '1', '-1']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.bitPos', async client => {
        assert.equal(
            await client.bitPos('key', 1, 1),
            -1
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.bitPos', async cluster => {
        assert.equal(
            await cluster.bitPos('key', 1, 1),
            -1
        );
    });
});
