import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZRANGE';

describe('ZRANGE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1),
                ['ZRANGE', 'src', '0', '1']
            );
        });

        it('with BYSCORE', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1, {
                    BY: 'SCORE'
                }),
                ['ZRANGE', 'src', '0', '1', 'BYSCORE']
            );
        });

        it('with BYLEX', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1, {
                    BY: 'LEX'
                }),
                ['ZRANGE', 'src', '0', '1', 'BYLEX']
            );
        });

        it('with REV', () => {
            assert.deepEqual(
                transformArguments('src', 0, 1, {
                    REV: true
                }),
                ['ZRANGE', 'src', '0', '1', 'REV']
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
                ['ZRANGE', 'src', '0', '1', 'LIMIT', '0', '1']
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
                ['ZRANGE', 'src', '0', '1', 'BYSCORE', 'REV', 'LIMIT', '0', '1']
            );
        });
    });

    testUtils.testWithClient('client.zRange', async client => {
        assert.deepEqual(
            await client.zRange('src', 0, 1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
