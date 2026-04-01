import { strict as assert } from 'node:assert';
import { TIME_SERIES_DUPLICATE_POLICIES } from './helpers';
import testUtils, { GLOBAL } from '../test-utils';
import INFO, { InfoReply } from './INFO';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            parseArgs(INFO, 'key'),
            ['TS.INFO', 'key']
        );
    });

    testUtils.testWithClient('client.ts.info', async client => {
        await Promise.all([
            client.ts.create('key', {
                LABELS: { id: '1' },
                DUPLICATE_POLICY: TIME_SERIES_DUPLICATE_POLICIES.LAST
            }),
            client.ts.create('key2'),
            client.ts.createRule('key', 'key2', TIME_SERIES_AGGREGATION_TYPE.COUNT, 5),
            client.ts.add('key', 1, 10)
        ]);

        assertInfo(await client.ts.info('key') as any);
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('client.ts.info - RESP2 shape assertion', async client => {
        await client.ts.create('key', {
            LABELS: { label1: 'value1', label2: 'value2' },
            DUPLICATE_POLICY: TIME_SERIES_DUPLICATE_POLICIES.LAST
        });
        await client.ts.create('key2');
        await client.ts.createRule('key', 'key2', TIME_SERIES_AGGREGATION_TYPE.AVG, 60000);
        await client.ts.add('key', 1000, 100);

        const info = await client.ts.info('key');

        // Assert the full RESP2 response shape - this will break if server switches to RESP3 Map
        assert.ok(typeof info === 'object' && info !== null);
        assert.equal(typeof info.totalSamples, 'number');
        assert.equal(typeof info.memoryUsage, 'number');
        assert.equal(typeof info.firstTimestamp, 'number');
        assert.equal(typeof info.lastTimestamp, 'number');
        assert.equal(typeof info.retentionTime, 'number');
        assert.equal(typeof info.chunkCount, 'number');
        assert.equal(typeof info.chunkSize, 'number');
        assert.equal(typeof info.chunkType, 'string');
        assert.equal(info.duplicatePolicy, 'last');

        // Assert labels array structure
        assert.ok(Array.isArray(info.labels));
        assert.equal(info.labels.length, 2);
        assert.deepStrictEqual(
            info.labels.sort((a, b) => a.name.localeCompare(b.name)),
            [
                { name: 'label1', value: 'value1' },
                { name: 'label2', value: 'value2' }
            ]
        );

        // Assert rules array structure
        assert.ok(Array.isArray(info.rules));
        assert.equal(info.rules.length, 1);
        assert.deepStrictEqual(info.rules[0], {
            key: 'key2',
            timeBucket: 60000,
            aggregationType: TIME_SERIES_AGGREGATION_TYPE.AVG
        });

        assert.equal(info.sourceKey, null);

        // Verify the overall object has the expected keys (object shape, not array)
        const expectedKeys = [
            'totalSamples', 'memoryUsage', 'firstTimestamp', 'lastTimestamp',
            'retentionTime', 'chunkCount', 'chunkSize', 'chunkType',
            'duplicatePolicy', 'labels', 'sourceKey', 'rules'
        ];
        for (const key of expectedKeys) {
            assert.ok(key in info, `Expected key '${key}' to be present in info object`);
        }
    }, GLOBAL.SERVERS.OPEN);
});

export function assertInfo(info: InfoReply): void {
    assert.equal(typeof info.totalSamples, 'number');
    assert.equal(typeof info.memoryUsage, 'number');
    assert.equal(typeof info.firstTimestamp, 'number');
    assert.equal(typeof info.lastTimestamp, 'number');
    assert.equal(typeof info.retentionTime, 'number');
    assert.equal(typeof info.chunkCount, 'number');
    assert.equal(typeof info.chunkSize, 'number');
    assert.equal(typeof info.chunkType, 'string');
    assert.equal(typeof info.duplicatePolicy, 'string');
    assert.ok(Array.isArray(info.labels));
    for (const label of info.labels) {
        assert.equal(typeof label, 'object');
        assert.equal(typeof label.name, 'string');
        assert.equal(typeof label.value, 'string');
    }
    assert.ok(Array.isArray(info.rules));
    for (const rule of info.rules) {
        assert.equal(typeof rule, 'object');
        assert.equal(typeof rule.aggregationType, 'string');
        assert.equal(typeof rule.key, 'string');
        assert.equal(typeof rule.timeBucket, 'number');
    }
    assert.ok(info.sourceKey === null || typeof info.sourceKey === 'string');
}
