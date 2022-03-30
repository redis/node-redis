import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SORT';

describe('SORT', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['SORT', 'key']
            );
        });

        it('with BY', () => {
            assert.deepEqual(
                transformArguments('key', {
                    BY: 'pattern'
                }),
                ['SORT', 'key', 'BY', 'pattern']
            );
        });

        it('with LIMIT', () => {
            assert.deepEqual(
                transformArguments('key', {
                    LIMIT: {
                        offset: 0,
                        count: 1
                    }
                }),
                ['SORT', 'key', 'LIMIT', '0', '1']
            );
        });

        describe('with GET', () => {
            it('string', () => {
                assert.deepEqual(
                    transformArguments('key', {
                        GET: 'pattern'
                    }),
                    ['SORT', 'key', 'GET', 'pattern']
                );
            });

            it('array', () => {
                assert.deepEqual(
                    transformArguments('key', {
                        GET: ['1', '2']
                    }),
                    ['SORT', 'key', 'GET', '1', 'GET', '2']
                );
            });
        });

        it('with DIRECTION', () => {
            assert.deepEqual(
                transformArguments('key', {
                    DIRECTION: 'ASC'
                }),
                ['SORT', 'key', 'ASC']
            );
        });

        it('with ALPHA', () => {
            assert.deepEqual(
                transformArguments('key', {
                    ALPHA: true
                }),
                ['SORT', 'key', 'ALPHA']
            );
        });

        it('with BY, LIMIT, GET, DIRECTION, ALPHA', () => {
            assert.deepEqual(
                transformArguments('key', {
                    BY: 'pattern',
                    LIMIT: {
                        offset: 0,
                        count: 1
                    },
                    GET: 'pattern',
                    DIRECTION: 'ASC',
                    ALPHA: true
                }),
                ['SORT', 'key', 'BY', 'pattern', 'LIMIT', '0', '1', 'GET', 'pattern', 'ASC', 'ALPHA']
            );
        });
    });

    testUtils.testWithClient('client.sort', async client => {
        assert.deepEqual(
            await client.sort('key'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
