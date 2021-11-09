import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XADD';

describe('XADD', () => {
    describe('transformArguments', () => {
        it('single field', () => {
            assert.deepEqual(
                transformArguments('key', '*', {
                    field: 'value'
                }),
                ['XADD', 'key', '*', 'field', 'value']
            );
        });

        it('multiple fields', () => {
            assert.deepEqual(
                transformArguments('key', '*', {
                    '1': 'I',
                    '2': 'II'
                }),
                ['XADD', 'key', '*', '1', 'I', '2', 'II']
            );
        });

        it('with NOMKSTREAM', () => {
            assert.deepEqual(
                transformArguments('key', '*', {
                    field: 'value'
                }, {
                    NOMKSTREAM: true
                }),
                ['XADD', 'key', 'NOMKSTREAM', '*', 'field', 'value']
            );
        });

        it('with TRIM', () => {
            assert.deepEqual(
                transformArguments('key', '*', {
                    field: 'value'
                }, {
                    TRIM: {
                        threshold: 1000
                    }
                }),
                ['XADD', 'key', '1000', '*', 'field', 'value']
            );
        });

        it('with TRIM.strategy', () => {
            assert.deepEqual(
                transformArguments('key', '*', {
                    field: 'value'
                }, {
                    TRIM: {
                        strategy: 'MAXLEN',
                        threshold: 1000
                    }
                }),
                ['XADD', 'key', 'MAXLEN', '1000', '*','field', 'value']
            );
        });

        it('with TRIM.strategyModifier', () => {
            assert.deepEqual(
                transformArguments('key', '*', {
                    field: 'value'
                }, {
                    TRIM: {
                        strategyModifier: '=',
                        threshold: 1000
                    }
                }),
                ['XADD', 'key', '=', '1000', '*', 'field', 'value']
            );
        });

        it('with TRIM.limit', () => {
            assert.deepEqual(
                transformArguments('key', '*', {
                    field: 'value'
                }, {
                    TRIM: {
                        threshold: 1000,
                        limit: 1
                    }
                }),
                ['XADD', 'key', '1000', 'LIMIT', '1', '*', 'field', 'value']
            );
        });

        it('with NOMKSTREAM, TRIM, TRIM.*', () => {
            assert.deepEqual(
                transformArguments('key', '*', {
                    field: 'value'
                }, {
                    NOMKSTREAM: true,
                    TRIM: {
                        strategy: 'MAXLEN',
                        strategyModifier: '=',
                        threshold: 1000,
                        limit: 1
                    }
                }),
                ['XADD', 'key', 'NOMKSTREAM', 'MAXLEN', '=', '1000', 'LIMIT', '1', '*', 'field', 'value']
            );
        });
    });

    testUtils.testWithClient('client.xAdd', async client => {
        assert.equal(
            typeof await client.xAdd('key', '*', {
                field: 'value'
            }),
            'string'
        );
    }, GLOBAL.SERVERS.OPEN);
});
