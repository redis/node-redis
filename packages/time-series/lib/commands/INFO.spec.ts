import { strict as assert } from 'assert';
import { TimeSeriesAggregationType, TimeSeriesDuplicatePolicies } from '.';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './INFO';

describe('INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TS.INFO', 'key']
        );
    });

    testUtils.testWithClient('client.ts.info', async client => {
        await Promise.all([
            client.ts.create('key', {
                LABELS: { id: "2" },
                DUPLICATE_POLICY: TimeSeriesDuplicatePolicies.LAST
            }),
            client.ts.create('key2'),
            client.ts.createRule('key', 'key2', TimeSeriesAggregationType.COUNT, 5),
            client.ts.add('key', 1, 10)
        ]);

        assert.deepEqual(
            await client.ts.info('key'),
            {
                totalSamples: 1,
                memoryUsage: 4261,
                firstTimestamp: 1,
                lastTimestamp: 1,
                retentionTime: 0,
                chunkCount: 1,
                chunkSize: 4096,
                chunkType: 'compressed',
                duplicatePolicy: 'last',
                labels: [{
                    name: 'id',
                    value: '2'
                }],
                rules: [{
                    aggregationType: 'COUNT',
                    key: 'key2',
                    timeBucket: 5
                }],
                sourceKey: null
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
