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

        it('with RETENTION, CHUNK_SIZE, DUPLICATE_POLICY, LABELS', () => {
            assert.deepEqual(
                transformArguments('key', {
                    RETENTION: 1,
                    CHUNK_SIZE: 1,
                    DUPLICATE_POLICY: TimeSeriesDuplicatePolicies.BLOCK,
                    LABELS: { label: 'value' }
                }),
                ['TS.ALTER', 'key', 'RETENTION', '1', 'CHUNK_SIZE', '1', 'DUPLICATE_POLICY', 'BLOCK', 'LABELS', 'label', 'value']
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
