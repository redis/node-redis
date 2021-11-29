import { strict as assert } from 'assert';
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

        it('with LABELS', () => {
            assert.deepEqual(
                transformArguments('key', {
                    LABELS: { label: 'value' }
                }),
                ['TS.ALTER', 'key', 'LABELS', 'label', 'value']
            );
        });

        it('with RETENTION, LABELS', () => {
            assert.deepEqual(
                transformArguments('key', {
                    RETENTION: 1,
                    LABELS: { label: 'value' }
                }),
                ['TS.ALTER', 'key', 'RETENTION', '1', 'LABELS', 'label', 'value']
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
