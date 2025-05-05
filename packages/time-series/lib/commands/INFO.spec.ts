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
