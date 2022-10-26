import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './REVRANGE';
import { TimeSeriesAggregationType } from '.';

describe('REVRANGE', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('key', '-', '+'),
                ['TS.REVRANGE', 'key', '-', '+']
            );
        });

        it('with FILTER_BY_TS', () => {
            assert.deepEqual(
                transformArguments('key', '-', '+', {
                    FILTER_BY_TS: [0]
                }),
                ['TS.REVRANGE', 'key', '-', '+', 'FILTER_BY_TS', '0']
            );
        });

        it('with FILTER_BY_VALUE', () => {
            assert.deepEqual(
                transformArguments('key', '-', '+', {
                    FILTER_BY_VALUE: {
                        min: 1,
                        max: 2
                    }
                }),
                ['TS.REVRANGE', 'key', '-', '+', 'FILTER_BY_VALUE', '1', '2']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('key', '-', '+', {
                    COUNT: 1
                }),
                ['TS.REVRANGE', 'key', '-', '+', 'COUNT', '1']
            );
        });

        it('with ALIGN', () => {
            assert.deepEqual(
                transformArguments('key', '-', '+', {
                    ALIGN: '-'
                }),
                ['TS.REVRANGE', 'key', '-', '+', 'ALIGN', '-']
            );
        });

        it('with AGGREGATION', () => {
            assert.deepEqual(
                transformArguments('key', '-', '+', {
                    AGGREGATION: {
                        type: TimeSeriesAggregationType.AVERAGE,
                        timeBucket: 1
                    }
                }),
                ['TS.REVRANGE', 'key', '-', '+', 'AGGREGATION', 'AVG', '1']
            );
        });

        it('with FILTER_BY_TS, FILTER_BY_VALUE, COUNT, ALIGN, AGGREGATION', () => {
            assert.deepEqual(
                transformArguments('key', '-', '+', {
                    FILTER_BY_TS: [0],
                    FILTER_BY_VALUE: {
                        min: 1,
                        max: 2
                    },
                    COUNT: 1,
                    ALIGN: '-',
                    AGGREGATION: {
                        type: TimeSeriesAggregationType.AVERAGE,
                        timeBucket: 1
                    }
                }),
                [
                    'TS.REVRANGE', 'key', '-', '+', 'FILTER_BY_TS', '0', 'FILTER_BY_VALUE',
                    '1', '2', 'COUNT', '1', 'ALIGN', '-', 'AGGREGATION', 'AVG', '1'
                ]
            );
        });
    });

    testUtils.testWithClient('client.ts.revRange', async client => {
        await Promise.all([
            client.ts.add('key', 0, 1),
            client.ts.add('key', 1, 2)
        ]);

        assert.deepEqual(
            await client.ts.revRange('key', '-', '+'),
            [{
                timestamp: 1,
                value: 2
            }, {
                timestamp: 0,
                value: 1
            }]
        );
    }, GLOBAL.SERVERS.OPEN);
});
