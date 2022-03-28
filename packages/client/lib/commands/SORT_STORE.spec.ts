import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SORT_STORE';

describe('SORT STORE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('source', 'destination'),
                ['SORT', 'source', 'STORE', 'destination']
            );
        });

        it('with BY', () => {
            assert.deepEqual(
                transformArguments('source', 'destination', {
                    BY: 'pattern'
                }),
                ['SORT', 'source', 'BY', 'pattern', 'STORE', 'destination']
            );
        });

        it('with LIMIT', () => {
            assert.deepEqual(
                transformArguments('source', 'destination', {
                    LIMIT: {
                        offset: 0,
                        count: 1
                    }
                }),
                ['SORT', 'source', 'LIMIT', '0', '1', 'STORE', 'destination']
            );
        });

        describe('with GET', () => {
            it('string', () => {
                assert.deepEqual(
                    transformArguments('source', 'destination', {
                        GET: 'pattern'
                    }),
                    ['SORT', 'source', 'GET', 'pattern', 'STORE', 'destination']
                );
            });

            it('array', () => {
                assert.deepEqual(
                    transformArguments('source', 'destination', {
                        GET: ['1', '2']
                    }),
                    ['SORT', 'source', 'GET', '1', 'GET', '2', 'STORE', 'destination']
                );
            });
        });

        it('with DIRECTION', () => {
            assert.deepEqual(
                transformArguments('source', 'destination', {
                    DIRECTION: 'ASC'
                }),
                ['SORT', 'source', 'ASC', 'STORE', 'destination']
            );
        });

        it('with ALPHA', () => {
            assert.deepEqual(
                transformArguments('source', 'destination', {
                    ALPHA: true
                }),
                ['SORT', 'source', 'ALPHA', 'STORE', 'destination']
            );
        });

        it('with BY, LIMIT, GET, DIRECTION, ALPHA', () => {
            assert.deepEqual(
                transformArguments('source', 'destination', {
                    BY: 'pattern',
                    LIMIT: {
                        offset: 0,
                        count: 1
                    },
                    GET: 'pattern',
                    DIRECTION: 'ASC',
                    ALPHA: true
                }),
                ['SORT', 'source', 'BY', 'pattern', 'LIMIT', '0', '1', 'GET', 'pattern', 'ASC', 'ALPHA', 'STORE', 'destination']
            );
        });
    });

    testUtils.testWithClient('client.sortStore', async client => {
        assert.equal(
            await client.sortStore('source', 'destination'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
