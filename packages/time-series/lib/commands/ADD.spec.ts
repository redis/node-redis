import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ADD';
import { TimeSeriesDuplicatePolicies, TimeSeriesEncoding } from '.';

describe('ADD', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('key', '*', 1),
                ['TS.ADD', 'key', '*', '1']
            );
        });

        it('with RETENTION', () => {
            assert.deepEqual(
                transformArguments('key', '*', 1, {
                    RETENTION: 1
                }),
                ['TS.ADD', 'key', '*', '1', 'RETENTION', '1']
            );
        });

        it('with ENCODING', () => {
            assert.deepEqual(
                transformArguments('key', '*', 1, {
                    ENCODING: TimeSeriesEncoding.UNCOMPRESSED
                }),
                ['TS.ADD', 'key', '*', '1', 'ENCODING', 'UNCOMPRESSED']
            );
        });

        it('with CHUNK_SIZE', () => {
            assert.deepEqual(
                transformArguments('key', '*', 1, {
                    CHUNK_SIZE: 1
                }),
                ['TS.ADD', 'key', '*', '1', 'CHUNK_SIZE', '1']
            );
        });

        it('with ON_DUPLICATE', () => {
            assert.deepEqual(
                transformArguments('key', '*', 1, {
                    ON_DUPLICATE: TimeSeriesDuplicatePolicies.BLOCK
                }),
                ['TS.ADD', 'key', '*', '1', 'ON_DUPLICATE', 'BLOCK']
            );
        });

        it('with LABELS', () => {
            assert.deepEqual(
                transformArguments('key', '*', 1, {
                    LABELS: { label: 'value' }
                }),
                ['TS.ADD', 'key', '*', '1', 'LABELS', 'label', 'value']
            );
        });

        it('with RETENTION, ENCODING, CHUNK_SIZE, ON_DUPLICATE, LABELS', () => {
            assert.deepEqual(
                transformArguments('key', '*', 1, {
                    RETENTION: 1,
                    ENCODING: TimeSeriesEncoding.UNCOMPRESSED,
                    CHUNK_SIZE: 1,
                    ON_DUPLICATE: TimeSeriesDuplicatePolicies.BLOCK,
                    LABELS: { label: 'value' }
                }),
                ['TS.ADD', 'key', '*', '1', 'RETENTION', '1', 'ENCODING', 'UNCOMPRESSED', 'CHUNK_SIZE', '1', 'ON_DUPLICATE', 'BLOCK', 'LABELS', 'label', 'value']
            );
        });
    });

    testUtils.testWithClient('client.ts.add', async client => {
        assert.equal(
            await client.ts.add('key', 0, 1),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
