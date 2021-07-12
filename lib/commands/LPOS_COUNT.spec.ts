import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './LPOS_COUNT';

describe('LPOS COUNT', () => {
    describeHandleMinimumRedisVersion([6, 0, 6]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 'element', 0),
                ['LPOS', 'key', 'element', 'COUNT', '0']
            );
        });

        it('with RANK', () => {
            assert.deepEqual(
                transformArguments('key', 'element', 0, {
                    RANK: 0
                }),
                ['LPOS', 'key', 'element', 'RANK', '0', 'COUNT', '0']
            );
        });

        it('with MAXLEN', () => {
            assert.deepEqual(
                transformArguments('key', 'element', 0, {
                    MAXLEN: 10
                }),
                ['LPOS', 'key', 'element', 'COUNT', '0', 'MAXLEN', '10']
            );
        });

        it('with RANK, MAXLEN', () => {
            assert.deepEqual(
                transformArguments('key', 'element', 0, {
                    RANK: 0,
                    MAXLEN: 10
                }),
                ['LPOS', 'key', 'element', 'RANK', '0', 'COUNT', '0', 'MAXLEN', '10']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.lPosCount', async client => {
        assert.deepEqual(
            await client.lPosCount('key', 'element', 0),
            []
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.lPosCount', async cluster => {
        assert.deepEqual(
            await cluster.lPosCount('key', 'element', 0),
            []
        );
    });
});
