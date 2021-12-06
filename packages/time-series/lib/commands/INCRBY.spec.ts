import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './INCRBY';

describe('INCRBY', () => {
    describe('transformArguments', () => {
        it('without options', () => {
            assert.deepEqual(
                transformArguments('key', 1),
                ['TS.INCRBY', 'key', '1']
            );
        });

        it('with TIMESTAMP', () => {
            assert.deepEqual(
                transformArguments('key', 1, {
                    TIMESTAMP: '*'
                }),
                ['TS.INCRBY', 'key', '1', 'TIMESTAMP', '*']
            );
        });

        it('with RETENTION', () => {
            assert.deepEqual(
                transformArguments('key', 1, {
                    RETENTION: 1
                }),
                ['TS.INCRBY', 'key', '1', 'RETENTION', '1']
            );
        });

        it('with UNCOMPRESSED', () => {
            assert.deepEqual(
                transformArguments('key', 1, {
                    UNCOMPRESSED: true
                }),
                ['TS.INCRBY', 'key', '1', 'UNCOMPRESSED']
            );
        });

        it('without UNCOMPRESSED', () => {
            assert.deepEqual(
                transformArguments('key', 1, {
                    UNCOMPRESSED: false
                }),
                ['TS.INCRBY', 'key', '1']
            );
        });

        it('with CHUNK_SIZE', () => {
            assert.deepEqual(
                transformArguments('key', 1, {
                    CHUNK_SIZE: 1
                }),
                ['TS.INCRBY', 'key', '1', 'CHUNK_SIZE', '1']
            );
        });

        it('with LABELS', () => {
            assert.deepEqual(
                transformArguments('key', 1, {
                    LABELS: { label: 'value' }
                }),
                ['TS.INCRBY', 'key', '1', 'LABELS', 'label', 'value']
            );
        });

        it('with TIMESTAMP, RETENTION, UNCOMPRESSED, CHUNK_SIZE and LABELS', () => {
            assert.deepEqual(
                transformArguments('key', 1, {
                    TIMESTAMP: '*',
                    RETENTION: 1,
                    UNCOMPRESSED: true,
                    CHUNK_SIZE: 1,
                    LABELS: { label: 'value' }
                }),
                ['TS.INCRBY', 'key', '1', 'TIMESTAMP', '*', 'RETENTION', '1', 'UNCOMPRESSED',
                'CHUNK_SIZE', '1', 'LABELS', 'label', 'value']
            );
        });
    });

    testUtils.testWithClient('client.ts.incrBy', async client => {
        assert.equal(
            await client.ts.incrBy('key', 1, {
                TIMESTAMP: 0
            }),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
