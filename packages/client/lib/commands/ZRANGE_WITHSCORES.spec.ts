import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZRANGE_WITHSCORES';

describe('ZRANGE WITHSCORES', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1),
                ['ZRANGE', 'src', '0', '1', 'WITHSCORES']
            );
        });

        it('with BY', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1, {
                    BY: 'SCORE'
                }),
                ['ZRANGE', 'src', '0', '1', 'BYSCORE', 'WITHSCORES']
            );
        });

        it('with REV', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1, {
                    REV: true
                }),
                ['ZRANGE', 'src', '0', '1', 'REV', 'WITHSCORES']
            );
        });

        it('with LIMIT', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1, {
                    LIMIT: {
                        offset: 0,
                        count: 1
                    }
                }),
                ['ZRANGE', 'src', '0', '1', 'LIMIT', '0', '1', 'WITHSCORES']
            );
        });

        it('with BY & REV & LIMIT', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1, {
                    BY: 'SCORE',
                    REV: true,
                    LIMIT: {
                        offset: 0,
                        count: 1
                    }
                }),
                ['ZRANGE', 'src', '0', '1', 'BYSCORE', 'REV', 'LIMIT', '0', '1', 'WITHSCORES']
            );
        });
    });

    testUtils.testWithClient('client.zRangeWithScores', async client => {
        assert.deepEqual(
            await client.zRangeWithScores('src', 0, 1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
