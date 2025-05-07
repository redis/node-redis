import { strict as assert } from 'node:assert';
import { TIME_SERIES_DUPLICATE_POLICIES } from './helpers';
import testUtils, { GLOBAL } from '../test-utils';
import { assertInfo } from './INFO.spec';
import INFO_DEBUG from './INFO_DEBUG';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.INFO_DEBUG', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            parseArgs(INFO_DEBUG, 'key'),
            ['TS.INFO', 'key', 'DEBUG']
        );
    });

    testUtils.testWithClient('client.ts.infoDebug', async client => {
        await Promise.all([
            client.ts.create('key', {
                LABELS: { id: '1' },
                DUPLICATE_POLICY: TIME_SERIES_DUPLICATE_POLICIES.LAST
            }),
            client.ts.create('key2'),
            client.ts.createRule('key', 'key2', TIME_SERIES_AGGREGATION_TYPE.COUNT, 5),
            client.ts.add('key', 1, 10)
        ]);

        const infoDebug = await client.ts.infoDebug('key');
        assertInfo(infoDebug as any);
        assert.equal(typeof infoDebug.keySelfName, 'string');
        assert.ok(Array.isArray(infoDebug.chunks));
        for (const chunk of infoDebug.chunks) {
            assert.equal(typeof chunk, 'object');
            assert.equal(typeof chunk.startTimestamp, 'number');
            assert.equal(typeof chunk.endTimestamp, 'number');
            assert.equal(typeof chunk.samples, 'number');
            assert.equal(typeof chunk.size, 'number');
            assert.equal(typeof chunk.bytesPerSample, 'string');
        }
    }, GLOBAL.SERVERS.OPEN);
});
