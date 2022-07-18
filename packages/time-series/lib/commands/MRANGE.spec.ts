import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MRANGE';
import { TimeSeriesAggregationType, TimeSeriesReducers } from '.';

describe('MRANGE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('-', '+', 'label=value', {
                FILTER_BY_TS: [0],
                FILTER_BY_VALUE: {
                    min: 0,
                    max: 1
                },
                COUNT: 1,
                ALIGN: '-',
                AGGREGATION: {
                    type: TimeSeriesAggregationType.AVERAGE,
                    timeBucket: 1
                },
                GROUPBY: {
                    label: 'label',
                    reducer: TimeSeriesReducers.SUM
                },
            }),
            ['TS.MRANGE', '-', '+', 'FILTER_BY_TS', '0', 'FILTER_BY_VALUE', '0', '1',
            'COUNT', '1', 'ALIGN', '-', 'AGGREGATION', 'AVG', '1', 'FILTER', 'label=value',
            'GROUPBY', 'label', 'REDUCE', 'SUM']
        );
    });

    testUtils.testWithClient('client.ts.mRange', async client => {
        await client.ts.add('key', 0, 0, {
            LABELS: { label: 'value'}
        });

        assert.deepEqual(
            await client.ts.mRange('-', '+', 'label=value', {
                COUNT: 1
            }),
            [{
                key: 'key',
                samples: [{
                    timestamp: 0,
                    value: 0
                }]
            }]
        );
    }, GLOBAL.SERVERS.OPEN);
});
