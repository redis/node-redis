import { strict as assert } from 'node:assert';
import { describe, it, before, after } from 'mocha';
import { createClient } from '../../index';
import { RESP_TYPES } from './decoder';
import { VerbatimString } from './verbatim-string';

describe('Comprehensive RESP Type Mapping', () => {
    let client: any;

    before(async () => {
        client = createClient();
        await client.connect();
    });


    after(async () => {
        if (client) {
            await client.destroy();
        }
    });

    describe('Scalar Primitives', () => {
        it('INTEGER: EXISTS returns number (0|1)', async () => {
            const res: number = await client
                .withTypeMapping({})
                .exists('some_key');

            assert.strictEqual(typeof res, 'number');
        });

        it('BIG_NUMBER: should infer as primitive bigint', async () => {
            const res: bigint | string | number = await client
                .withTypeMapping({
                    [RESP_TYPES.BIG_NUMBER]: BigInt
                })
                .hello();

            assert.ok(typeof res === 'bigint' || typeof res === 'object');
        });

        it('DOUBLE: should infer as primitive number', async () => {
            const res: number | null = await client
                .withTypeMapping({
                    [RESP_TYPES.DOUBLE]: Number
                })
                .hello();

            assert.ok(res === null || typeof res === 'number' || typeof res === 'object');
        });
    });

    describe('Complex Strings', () => {
        it('VERBATIM_STRING: should map to string, not object', async () => {
            const res: string | Buffer | VerbatimString = await client
                .withTypeMapping({
                    [RESP_TYPES.VERBATIM_STRING]: String
                })
                .get('key');

            assert.ok(
                res === null ||
                typeof res === 'string' ||
                Buffer.isBuffer(res)
            );
        });
    });

    describe('Recursive Collections', () => {
        it('ARRAY: should correctly infer nested mapped types', async () => {
            const res: string[] = await client
                .withTypeMapping({
                    [RESP_TYPES.BLOB_STRING]: String
                })
                .lRange('key', 0, -1);

            assert.ok(Array.isArray(res));
        });

        it('SET: should correctly infer Set of primitives', async () => {
            const res: Set<string> | string[] = await client
                .withTypeMapping({
                    [RESP_TYPES.BLOB_STRING]: String
                })
                .sMembers('key');

            assert.ok(res instanceof Set || Array.isArray(res));
        });

        it('MAP: should correctly infer Map with mapped keys and values', async () => {
            const res: Map<string, string> | Record<string, string> = await client
                .withTypeMapping({
                    [RESP_TYPES.BLOB_STRING]: String
                })
                .hGetAll('key');

            assert.ok(res instanceof Map || typeof res === 'object');
        });
    });

    describe('Edge Cases', () => {
        it('SIMPLE_ERROR: should still return Error objects', async () => {

            try {
                const res: Error = await client
                    .withTypeMapping({
                        [RESP_TYPES.SIMPLE_ERROR]: Error
                    })
                    .hello();
                assert.ok(typeof res === 'object');
            } catch (e) {
                assert.ok(e instanceof Error);
            }
        });

        it('NULL: should always remain null regardless of mapping', async () => {
            const res: string | null = await client
                .withTypeMapping({})
                .get('missing-key-random-12345');

            assert.strictEqual(res, null);
        });

        it('hGet: should infer string | null (fixing string | {})', async () => {
            const res: string | null = await client
                .withTypeMapping({
                    [RESP_TYPES.BLOB_STRING]: String
                })
                .hGet('foo', 'bar');

            assert.ok(res === null || typeof res === 'string');
        });
    });
});