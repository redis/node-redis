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
                    RETENTION: 100
                }),
                ['TS.INCRBY', 'key', '1', 'RETENTION', '100']
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
                    CHUNK_SIZE: 100
                }),
                ['TS.INCRBY', 'key', '1', 'CHUNK_SIZE', '100']
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
                    RETENTION: 100,
                    UNCOMPRESSED: true,
                    CHUNK_SIZE: 1000,
                    LABELS: { label: 'value', label2: 'new_value' }
                }),
                ['TS.INCRBY', 'key', '1', 'TIMESTAMP', '*', 'RETENTION', '100', 'UNCOMPRESSED',
                'CHUNK_SIZE', '1000', 'LABELS', 'label', 'value', 'label2', 'new_value']
            );
        });
    });

    testUtils.testWithClient('client.ts.decrBy', async client => {
        await Promise.all([
            client.ts.create('key'),
        ]);

        assert.equal(
            await client.ts.incrBy('key', 1, {
                TIMESTAMP: 1638267369476
            }),
            1638267369476
        );

        assert.deepEqual(
            await client.ts.get('key'),
            {
                timestamp: 1638267369476,
                value: 1
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
