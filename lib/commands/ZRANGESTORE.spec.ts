import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZRANGESTORE';

describe('ZRANGESTORE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('dst', 'src', 0, 1),
                ['ZRANGESTORE', 'dst', 'src', '0', '1']
            );
        });

        it('with BY', () => {
            assert.deepEqual(
                transformArguments('dst', 'src', 0, 1, {
                    BY: 'SCORE'
                }),
                ['ZRANGESTORE', 'dst', 'src', '0', '1', 'BYSCORE']
            );
        });

        it('with REV', () => {
            assert.deepEqual(
                transformArguments('dst', 'src', 0, 1, {
                    REV: true
                }),
                ['ZRANGESTORE', 'dst', 'src', '0', '1', 'REV']
            );
        });

        it('with LIMIT', () => {
            assert.deepEqual(
                transformArguments('dst', 'src', 0, 1, {
                    LIMIT: {
                        offset: 0,
                        count: 1
                    }
                }),
                ['ZRANGESTORE', 'dst', 'src', '0', '1', 'LIMIT', '0', '1']
            );
        });

        it('with BY & REV & LIMIT', () => {
            assert.deepEqual(
                transformArguments('dst', 'src', 0, 1, {
                    BY: 'SCORE',
                    REV: true,
                    LIMIT: {
                        offset: 0,
                        count: 1
                    },
                    WITHSCORES: true
                }),
                ['ZRANGESTORE', 'dst', 'src', '0', '1', 'BYSCORE', 'REV', 'LIMIT', '0', '1', 'WITHSCORES']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.zRangeStore', async client => {
        assert.equal(
            await client.zRangeStore('dst', 'src', 0, 1),
            0
        );
    });
});
