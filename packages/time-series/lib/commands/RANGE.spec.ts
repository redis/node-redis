import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './RANGE';
import { TimeSeriesAggregationType } from '.';

describe('RANGE', () => {
    it('transformArguments', () => {
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
            ['TS.RANGE', 'key', '-', '+', 'FILTER_BY_TS', '0', 'FILTER_BY_VALUE',
            '1', '2', 'COUNT', '1', 'ALIGN', '-', 'AGGREGATION', 'AVG', '1']
        );
    });

    testUtils.testWithClient('client.ts.range', async client => {
        await client.ts.add('key', 1, 2);

        assert.deepEqual(
            await client.ts.range('key', '-', '+'),
            [{
                timestamp: 1,
                value: 2
            }]
        );
    }, GLOBAL.SERVERS.OPEN);
});
