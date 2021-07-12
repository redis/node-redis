import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './LPOS';

describe('LPOS', () => {
    describeHandleMinimumRedisVersion([6, 0, 6]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 'element'),
                ['LPOS', 'key', 'element']
            );
        });

        it('with RANK', () => {
            assert.deepEqual(
                transformArguments('key', 'element', {
                    RANK: 0
                }),
                ['LPOS', 'key', 'element', 'RANK', '0']
            );
        });

        it('with MAXLEN', () => {
            assert.deepEqual(
                transformArguments('key', 'element', {
                    MAXLEN: 10
                }),
                ['LPOS', 'key', 'element', 'MAXLEN', '10']
            );
        });

        it('with RANK, MAXLEN', () => {
            assert.deepEqual(
                transformArguments('key', 'element', {
                    RANK: 0,
                    MAXLEN: 10
                }),
                ['LPOS', 'key', 'element', 'RANK', '0', 'MAXLEN', '10']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.lPos', async client => {
        assert.equal(
            await client.lPos('key', 'element'),
            null
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lPos', async cluster => {
        assert.equal(
            await cluster.lPos('key', 'element'),
            null
        );
    });
});
