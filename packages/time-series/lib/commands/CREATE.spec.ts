import { strict as assert } from 'assert';
import { TimeSeriesDuplicatePolicies, TimeSeriesEncoding } from '.';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CREATE';

describe('CREATE', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['TS.CREATE', 'key']
            );
        });

        it('with RETENTION', () => {
            assert.deepEqual(
                transformArguments('key', {
                    RETENTION: 1
                }),
                ['TS.CREATE', 'key', 'RETENTION', '1']
            );
        });

        it('with ENCODING', () => {
            assert.deepEqual(
                transformArguments('key', {
                    ENCODING: TimeSeriesEncoding.UNCOMPRESSED
                }),
                ['TS.CREATE', 'key', 'ENCODING', 'UNCOMPRESSED']
            );
        });

        it('with CHUNK_SIZE', () => {
            assert.deepEqual(
                transformArguments('key', {
                    CHUNK_SIZE: 1
                }),
                ['TS.CREATE', 'key', 'CHUNK_SIZE', '1']
            );
        });

        it('with DUPLICATE_POLICY', () => {
            assert.deepEqual(
                transformArguments('key', {
                    DUPLICATE_POLICY: TimeSeriesDuplicatePolicies.BLOCK
                }),
                ['TS.CREATE', 'key', 'DUPLICATE_POLICY', 'BLOCK']
            );
        });

        it('with LABELS', () => {
            assert.deepEqual(
                transformArguments('key', {
                    LABELS: { label: 'value' }
                }),
                ['TS.CREATE', 'key', 'LABELS', 'label', 'value']
            );
        });

        it('with RETENTION, ENCODING, CHUNK_SIZE, DUPLICATE_POLICY, LABELS', () => {
            assert.deepEqual(
                transformArguments('key', {
                    RETENTION: 1,
                    ENCODING: TimeSeriesEncoding.UNCOMPRESSED,
                    CHUNK_SIZE: 1,
                    DUPLICATE_POLICY: TimeSeriesDuplicatePolicies.BLOCK,
                    LABELS: { label: 'value' }
                }),
                ['TS.CREATE', 'key', 'RETENTION', '1', 'ENCODING', 'UNCOMPRESSED', 'CHUNK_SIZE', '1', 'DUPLICATE_POLICY', 'BLOCK', 'LABELS', 'label', 'value']
            );
        });
    });

    testUtils.testWithClient('client.ts.create', async client => {
        assert.equal(
            await client.ts.create('key'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
