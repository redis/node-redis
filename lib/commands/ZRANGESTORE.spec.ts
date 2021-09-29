import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments, transformReply } from './ZRANGESTORE';

describe('ZRANGESTORE', () => {
    describeHandleMinimumRedisVersion([6, 2]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('dst', 'src', 0, 1),
                ['ZRANGESTORE', 'dst', 'src', '0', '1']
            );
        });

        it('with BYSCORE', () => {
            assert.deepEqual(
                transformArguments('dst', 'src', 0, 1, {
                    BY: 'SCORE'
                }),
                ['ZRANGESTORE', 'dst', 'src', '0', '1', 'BYSCORE']
            );
        });

        it('with BYLEX', () => {
            assert.deepEqual(
                transformArguments('dst', 'src', 0, 1, {
                    BY: 'LEX'
                }),
                ['ZRANGESTORE', 'dst', 'src', '0', '1', 'BYLEX']
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

    describe('transformReply', () => {
        it('should throw TypeError when reply is not a number', () => {
            assert.throws(
                () => (transformReply as any)([]),
                TypeError
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.zRangeStore', async client => {
        await client.zAdd('src', {
            score: 0.5,
            value: 'value'
        });

        assert.equal(
            await client.zRangeStore('dst', 'src', 0, 1),
            1
        );
    });
});
