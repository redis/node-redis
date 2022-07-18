import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MREVRANGE_WITHLABELS';
import { TimeSeriesAggregationType, TimeSeriesReducers } from '.';

describe('MREVRANGE_WITHLABELS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('-', '+', 'label=value', {
                FILTER_BY_TS: [0],
                FILTER_BY_VALUE: {
                    min: 0,
                    max: 1
                },
                SELECTED_LABELS: ['label'],
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
            ['TS.MREVRANGE', '-', '+', 'FILTER_BY_TS', '0', 'FILTER_BY_VALUE', '0', '1',
            'COUNT', '1', 'ALIGN', '-', 'AGGREGATION', 'AVG', '1', 'SELECTED_LABELS', 'label',
            'FILTER', 'label=value', 'GROUPBY', 'label', 'REDUCE', 'SUM']
        );
    });

    testUtils.testWithClient('client.ts.mRevRangeWithLabels', async client => {
        await client.ts.add('key', 0, 0, {
            LABELS: { label: 'value'}
        });

        assert.deepEqual(
            await client.ts.mRevRangeWithLabels('-', '+', 'label=value', {
                COUNT: 1
            }),
            [{
                key: 'key',
                labels: { label: 'value' },
                samples: [{
                    timestamp: 0,
                    value: 0
                }]
            }]
        );
    }, GLOBAL.SERVERS.OPEN);
});
