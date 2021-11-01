import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZUNION_WITHSCORES';

describe('ZUNION WITHSCORES', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    describe('transformArguments', () => {
        it('key (string)', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['ZUNION', '1', 'key', 'WITHSCORES']
            );
        });

        it('keys (array)', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['ZUNION', '2', '1', '2', 'WITHSCORES']
            );
        });

        it('with WEIGHTS', () => {
            assert.deepEqual(
                transformArguments('key', {
                    WEIGHTS: [1]
                }),
                ['ZUNION', '1', 'key', 'WEIGHTS', '1', 'WITHSCORES']
            );
        });

        it('with AGGREGATE', () => {
            assert.deepEqual(
                transformArguments('key', {
                    AGGREGATE: 'SUM'
                }),
                ['ZUNION', '1', 'key', 'AGGREGATE', 'SUM', 'WITHSCORES']
            );
        });
    });

    testUtils.testWithClient('client.zUnionWithScores', async client => {
        assert.deepEqual(
            await client.zUnionWithScores('key'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
