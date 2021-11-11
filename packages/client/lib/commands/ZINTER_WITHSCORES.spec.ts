import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZINTER_WITHSCORES';

describe('ZINTER WITHSCORES', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    describe('transformArguments', () => {
        it('key (string)', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['ZINTER', '1', 'key', 'WITHSCORES']
            );
        });

        it('keys (array)', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['ZINTER', '2', '1', '2', 'WITHSCORES']
            );
        });

        it('with WEIGHTS', () => {
            assert.deepEqual(
                transformArguments('key', {
                    WEIGHTS: [1]
                }),
                ['ZINTER', '1', 'key', 'WEIGHTS', '1', 'WITHSCORES']
            );
        });

        it('with AGGREGATE', () => {
            assert.deepEqual(
                transformArguments('key', {
                    AGGREGATE: 'SUM'
                }),
                ['ZINTER', '1', 'key', 'AGGREGATE', 'SUM', 'WITHSCORES']
            );
        });

        it('with WEIGHTS, AGGREGATE', () => {
            assert.deepEqual(
                transformArguments('key', {
                    WEIGHTS: [1],
                    AGGREGATE: 'SUM'
                }),
                ['ZINTER', '1', 'key', 'WEIGHTS', '1', 'AGGREGATE', 'SUM', 'WITHSCORES']
            );
        });
    });

    testUtils.testWithClient('client.zInterWithScores', async client => {
        assert.deepEqual(
            await client.zInterWithScores('key'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
