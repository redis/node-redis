import { strict as assert } from 'assert';
import { TimeSeriesAggregationType, TimeSeriesDuplicatePolicies } from '.';
import testUtils, { GLOBAL } from '../test-utils';
import { assertInfo } from './INFO.spec';
import { transformArguments } from './INFO_DEBUG';

describe('INFO_DEBUG', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TS.INFO', 'key', 'DEBUG']
        );
    });

    testUtils.testWithClient('client.ts.get', async client => {
        await Promise.all([
            client.ts.create('key', {
                LABELS: { id: '1' },
                DUPLICATE_POLICY: TimeSeriesDuplicatePolicies.LAST
            }),
            client.ts.create('key2'),
            client.ts.createRule('key', 'key2', TimeSeriesAggregationType.COUNT, 5),
            client.ts.add('key', 1, 10)
        ]);

        const infoDebug = await client.ts.infoDebug('key');
        assertInfo(infoDebug);
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
