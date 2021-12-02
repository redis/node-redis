import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './RANGE';
import { TimeSeriesAggregationType } from '.';

describe('RANGE', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('key', 0, 10),
                ['TS.RANGE', 'key', '0', '10']
            );
        });

        it('with FILTER_BY_TS', () => {
            assert.deepEqual(
                transformArguments('key', 0, 10, {
                    FILTER_BY_TS: [1]
                }),
                ['TS.RANGE', 'key', '0', '10', 'FILTER_BY_TS', '1']
            );
        });

        it('with FILTER_BY_VALUE', () => {
            assert.deepEqual(
                transformArguments('key', 0, 10, {
                    FILTER_BY_VALUE: {min: 4, max: 6}
                }),
                ['TS.RANGE', 'key', '0', '10', 'FILTER_BY_VALUE', '4', '6']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('key', 0, 10, {
                    COUNT: 1
                }),
                ['TS.RANGE', 'key', '0', '10', 'COUNT', '1']
            );
        });

        it('with ALIGN', () => {
            assert.deepEqual(
                transformArguments('key', 0, 10, {
                    ALIGN: '-'
                }),
                ['TS.RANGE', 'key', '0', '10', 'ALIGN', '-']
            );
        });

        it('with AGGREGATION', () => {
            assert.deepEqual(
                transformArguments('key', 0, 10, {
                    AGGREGATION: { 
                        type: TimeSeriesAggregationType.AVARAGE,
                        timeBucket: 5
                    }
                }),
                ['TS.RANGE', 'key', '0', '10', 'AGGREGATION', 'avg', '5']
            );
        });

        it('with FILTER_BY_TS, FILTER_BY_VALUE, COUNT, ALIGN, AGGREGATION', () => {
            assert.deepEqual(
                transformArguments('key', 0, 10, {
                    FILTER_BY_TS: [1],
                    FILTER_BY_VALUE: {
                        min: 4,
                        max: 6
                    },
                    COUNT: 1,
                    ALIGN: '+',
                    AGGREGATION: { 
                        type: TimeSeriesAggregationType.FIRST, 
                        timeBucket: 5 
                    }
                }),
                ['TS.RANGE', 'key', '0', '10', 'FILTER_BY_TS', '1', 'FILTER_BY_VALUE', 
                '4', '6', 'COUNT', '1', 'ALIGN', '+', 'AGGREGATION', 'first', '5']
            );
        });
    });

    testUtils.testWithClient('client.ts.range', async client => {
        await Promise.all([
            client.ts.create('key'),
            client.ts.add('key', 1, 2),
        ]);

        assert.deepEqual(
            await client.ts.range('key', 0, 10),
            [
                {
                    timestamp: 1,
                    value: 2
                }
            ]
        );
    }, GLOBAL.SERVERS.OPEN);
});
