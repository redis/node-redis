import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LPOS_COUNT';

describe('LPOS COUNT', () => {
    testUtils.isVersionGreaterThanHook([6, 0, 6]);

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

    testUtils.testWithClient('client.lPosCount', async client => {
        assert.deepEqual(
            await client.lPosCount('key', 'element', 0),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lPosCount', async cluster => {
        assert.deepEqual(
            await cluster.lPosCount('key', 'element', 0),
            []
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
