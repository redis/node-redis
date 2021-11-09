import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZADD';

describe('ZADD', () => {
    describe('transformArguments', () => {
        it('single member', () => {
            assert.deepEqual(
                transformArguments('key', {
                    value: '1',
                    score: 1
                }),
                ['ZADD', 'key', '1', '1']
            );
        });

        it('multiple members', () => {
            assert.deepEqual(
                transformArguments('key', [{
                    value: '1',
                    score: 1
                }, {
                    value: '2',
                    score: 2
                }]),
                ['ZADD', 'key', '1', '1', '2', '2']
            );
        });

        it('with NX', () => {
            assert.deepEqual(
                transformArguments('key', {
                    value: '1',
                    score: 1
                }, {
                    NX: true
                }),
                ['ZADD', 'key', 'NX', '1', '1']
            );
        });

        it('with XX', () => {
            assert.deepEqual(
                transformArguments('key', {
                    value: '1',
                    score: 1
                }, {
                    XX: true
                }),
                ['ZADD', 'key', 'XX', '1', '1']
            );
        });

        it('with GT', () => {
            assert.deepEqual(
                transformArguments('key', {
                    value: '1',
                    score: 1
                }, {
                    GT: true
                }),
                ['ZADD', 'key', 'GT', '1', '1']
            );
        });

        it('with LT', () => {
            assert.deepEqual(
                transformArguments('key', {
                    value: '1',
                    score: 1
                }, {
                    LT: true
                }),
                ['ZADD', 'key', 'LT', '1', '1']
            );
        });

        it('with CH', () => {
            assert.deepEqual(
                transformArguments('key', {
                    value: '1',
                    score: 1
                }, {
                    CH: true
                }),
                ['ZADD', 'key', 'CH', '1', '1']
            );
        });

        it('with INCR', () => {
            assert.deepEqual(
                transformArguments('key', {
                    value: '1',
                    score: 1
                }, {
                    INCR: true
                }),
                ['ZADD', 'key', 'INCR', '1', '1']
            );
        });

        it('with XX, GT, CH, INCR', () => {
            assert.deepEqual(
                transformArguments('key', {
                    value: '1',
                    score: 1
                }, {
                    XX: true,
                    GT: true,
                    CH: true,
                    INCR: true
                }),
                ['ZADD', 'key', 'XX', 'GT', 'CH', 'INCR', '1', '1']
            );
        });
    });

    testUtils.testWithClient('client.zAdd', async client => {
        assert.equal(
            await client.zAdd('key', {
                value: '1',
                score: 1
            }),
            1
        );
    }, GLOBAL.SERVERS.OPEN);
});
