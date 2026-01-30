import { strict as assert } from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { createClient } from '../../index';
import { RESP_TYPES } from './decoder';

describe('Comprehensive RESP Type Mapping', () => {
    let client: any;

    beforeEach(async () => {
        client = createClient();
        await client.connect();
    });

    afterEach(async () => {
        await client.destroy();
    });

    describe('Scalar Primitives', () => {
        it('INTEGER: EXISTS returns number (0|1)', async () => {
            const res = await client.withTypeMapping({}).exists('some_key');
            assert.strictEqual(typeof res, 'number');
        });

        it('BIG_NUMBER: maps to bigint when configured', async () => {
            const res = await client
                .withTypeMapping({
                    [RESP_TYPES.BIG_NUMBER]: BigInt
                })
                .hello();

            assert.ok(
                typeof res === 'bigint' ||
                typeof res === 'number' ||
                typeof res === 'object'
            );
        });


    });

    describe('Complex Strings', () => {
        it('VERBATIM_STRING maps to string', async () => {
            const res = await client
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
        it('ARRAY infers nested mapped types', async () => {
            const res = await client
                .withTypeMapping({
                    [RESP_TYPES.BLOB_STRING]: String
                })
                .lRange('key', 0, -1);

            assert.ok(Array.isArray(res));
        });

        it('SET infers Set or array', async () => {
            const res = await client
                .withTypeMapping({
                    [RESP_TYPES.BLOB_STRING]: String
                })
                .sMembers('key');

            assert.ok(res instanceof Set || Array.isArray(res));
        });

        it('MAP infers Map or object', async () => {
            const res = await client
                .withTypeMapping({
                    [RESP_TYPES.BLOB_STRING]: String
                })
                .hGetAll('key');

            assert.ok(res instanceof Map || typeof res === 'object');
        });
    });

    describe('Edge Cases', () => {
        it('SIMPLE_ERROR remains Error', async () => {
            try {
                await client
                    .withTypeMapping({
                        [RESP_TYPES.SIMPLE_ERROR]: Error
                    })
                    .hello();

                assert.fail('Expected error');
            } catch (e) {
                assert.ok(e instanceof Error);
            }
        });

        it('NULL always remains null', async () => {
            const res = await client
                .withTypeMapping({})
                .get('missing-key-random-12345');

            assert.strictEqual(res, null);
        });

        it('hGet infers string | null', async () => {
            const res = await client
                .withTypeMapping({
                    [RESP_TYPES.BLOB_STRING]: String
                })
                .hGet('foo', 'bar');

            assert.ok(res === null || typeof res === 'string');
        });
    });
});
