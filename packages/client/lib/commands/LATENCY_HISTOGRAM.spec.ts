import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LATENCY_HISTOGRAM, { LatencyHistogramBucket, LatencyHistogramOptions } from './LATENCY_HISTOGRAM';
import { LATENCY_EVENTS } from './LATENCY_GRAPH';
import { parseArgs } from './generic-transformers';

describe('LATENCY HISTOGRAM', function () {



    it('transformArguments with no options (event only)', () => {
        assert.deepEqual(
            parseArgs(LATENCY_HISTOGRAM, LATENCY_EVENTS.COMMAND),
            ['LATENCY', 'HISTOGRAM', 'command']
        );
    });

    it('transformArguments with buckets option', () => {
        const options: LatencyHistogramOptions = {
            buckets: [0, 10, 100, 1000]
        };
        assert.deepEqual(
            parseArgs(LATENCY_HISTOGRAM, LATENCY_EVENTS.COMMAND, options),
            ['LATENCY', 'HISTOGRAM', 'command', 'BUCKETS', '0', '10', '100', '1000']
        );
    });

    it('transformArguments with empty buckets array', () => {
        const options: LatencyHistogramOptions = {
            buckets: []
        };

        assert.deepEqual(
            parseArgs(LATENCY_HISTOGRAM, LATENCY_EVENTS.COMMAND, options),
            ['LATENCY', 'HISTOGRAM', 'command']
        );
    });


    it('transformReply with a typical histogram reply', () => {

        const rawReply: Array<[number, number]> = [
            [0, 10],
            [1, 20],
            [2, 30],
            [4, 40],
            [8, 50],
            [16, 60],
            [32, 70],
            [64, 80],
            [128, 90],
            [256, 100],
            [512, 110],
            [1024, 120]
        ];

        const expected: LatencyHistogramBucket[] = [
            { min: 0, max: 1, count: 10 },
            { min: 1, max: 2, count: 20 },
            { min: 2, max: 4, count: 30 },
            { min: 4, max: 8, count: 40 },
            { min: 8, max: 16, count: 50 },
            { min: 16, max: 32, count: 60 },
            { min: 32, max: 64, count: 70 },
            { min: 64, max: 128, count: 80 },
            { min: 128, max: 256, count: 90 },
            { min: 256, max: 512, count: 100 },
            { min: 512, max: 1024, count: 110 },
            { min: 1024, max: '+inf', count: 120 }
        ];

        assert.deepEqual(
            LATENCY_HISTOGRAM.transformReply(rawReply),
            expected
        );
    });

    it('transformReply with an empty reply', () => {
        assert.deepEqual(
            LATENCY_HISTOGRAM.transformReply([]),
            []
        );
    });

    it('transformReply with a single bucket reply', () => {
        const rawReply: Array<[number, number]> = [[0, 5]];
        const expected: LatencyHistogramBucket[] = [{ min: 0, max: '+inf', count: 5 }];
        assert.deepEqual(
            LATENCY_HISTOGRAM.transformReply(rawReply),
            expected
        );
    });

    it('transformReply with malformed buckets (should warn and skip)', () => {

        const malformedReply: Array<any> = [
            [0, 100],
            [100, 'invalid_count'],
            [200],
            [300, 50, 'extra'],
            'not_a_bucket',
            [400, 200]
        ];

        const expected: LatencyHistogramBucket[] = [
            { min: 0, max: 100, count: 100 },
            { min: 400, max: '+inf', count: 200 }
        ];

        assert.deepEqual(
            LATENCY_HISTOGRAM.transformReply(malformedReply),
            expected
        );
    });

    it('transformReply with non-array reply (should throw)', () => {
        assert.throws(
            () => LATENCY_HISTOGRAM.transformReply('not an array' as any),
            (err: Error) => {
                assert.ok(err instanceof Error);
                assert.equal(err.message, 'Unexpected reply type for LATENCY HISTOGRAM: expected array.');
                return true;
            },
            'Expected specific error for non-array reply'
        );
    });

    testUtils.testWithClient('client.latencyHistogram', async client => {

        await client.configSet('latency-monitor-threshold', '1');


        await client.sendCommand(['DEBUG', 'SLEEP', '0.1']);
        await client.sendCommand(['DEBUG', 'SLEEP', '0.02']);
        await client.sendCommand(['DEBUG', 'SLEEP', '0.05']);

        const histogram: Array<LatencyHistogramBucket> = await client.latencyHistogram(LATENCY_EVENTS.COMMAND);


        assert.ok(Array.isArray(histogram), 'Expected histogram to be an array.');
        assert.ok(histogram.length > 0, 'Expected histogram to contain buckets.');

        const firstBucket = histogram[0];
        assert.equal(typeof firstBucket.min, 'number', 'min should be a number.');
        assert.equal(typeof firstBucket.count, 'number', 'count should be a number.');

        assert.ok(typeof firstBucket.max === 'number' || firstBucket.max === '+inf', 'max should be a number or "+inf".');


        const totalCount = histogram.reduce((sum, b) => sum + b.count, 0);
        assert.ok(totalCount >= 3, 'Expected at least 3 events captured in the histogram.');


        await client.latencyReset();
        const latestAfterReset = await client.latencyLatest();
        assert.deepEqual(latestAfterReset, [], 'Expected latency events to be cleared after reset.');

    }, {

        serverArguments: ['---enable-debug-command','yes'],
        clientOptions: {
            socket: {
                connectTimeout: 300000
            }
        }
    });
});
