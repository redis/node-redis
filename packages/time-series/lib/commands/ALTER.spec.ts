import { strict as assert } from 'assert';
import { TimeSeriesDuplicatePolicies } from '.';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ALTER';

describe('ALTER', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['TS.ALTER', 'key']
            );
        });

        it('with RETENTION', () => {
            assert.deepEqual(
                transformArguments('key', {
                    RETENTION: 1
                }),
                ['TS.ALTER', 'key', 'RETENTION', '1']
            );
        });

        it('with CHUNK_SIZE', () => {
            assert.deepEqual(
                transformArguments('key', {
                    CHUNK_SIZE: 1
                }),
                ['TS.ALTER', 'key', 'CHUNK_SIZE', '1']
            );
        });

        it('with DUPLICATE_POLICY', () => {
            assert.deepEqual(
                transformArguments('key', {
                    DUPLICATE_POLICY: TimeSeriesDuplicatePolicies.BLOCK
                }),
                ['TS.ALTER', 'key', 'DUPLICATE_POLICY', 'BLOCK']
            );
        });

        it('with LABELS', () => {
            assert.deepEqual(
                transformArguments('key', {
                    LABELS: { label: 'value' }
                }),
                ['TS.ALTER', 'key', 'LABELS', 'label', 'value']
            );
        });

        it('with IGNORE with MAX_TIME_DIFF', () => {
            assert.deepEqual(
                transformArguments('key', {
                IGNORE: { MAX_TIME_DIFF: 1, MAX_VAL_DIFF: 1}
                }),
                ['TS.ALTER', 'key', 'IGNORE', '1', '1']
            )
        });

        it('with RETENTION, CHUNK_SIZE, DUPLICATE_POLICY, LABELS, IGNORE', () => {
            assert.deepEqual(
                transformArguments('key', {
                    RETENTION: 1,
                    CHUNK_SIZE: 1,
                    DUPLICATE_POLICY: TimeSeriesDuplicatePolicies.BLOCK,
                    LABELS: { label: 'value' },
                    IGNORE: { MAX_TIME_DIFF: 1, MAX_VAL_DIFF: 1}
                }),
                ['TS.ALTER', 'key', 'RETENTION', '1', 'CHUNK_SIZE', '1', 'DUPLICATE_POLICY', 'BLOCK', 'LABELS', 'label', 'value', 'IGNORE', '1', '1']
            );
        });
    });

    testUtils.testWithClient('client.ts.alter', async client => {
        await client.ts.create('key');

        assert.equal(
            await client.ts.alter('key', { RETENTION: 1 }),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
