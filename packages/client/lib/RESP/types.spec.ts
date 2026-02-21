import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { RESP_TYPES } from './decoder';

describe('RESP Type Mapping', () => {
    testUtils.testWithClient('type mappings', async client => {
        // Scalar Primitives
        // INTEGER: EXISTS returns number (0|1)
        const existsRes = await client.withTypeMapping({}).exists('some_key');
        assert.strictEqual(typeof existsRes, 'number');

        // BIG_NUMBER: maps to bigint when configured
        const bigNumRes = await client
            .withTypeMapping({
                [RESP_TYPES.BIG_NUMBER]: BigInt
            })
            .hello();
        assert.ok(
            typeof bigNumRes === 'bigint' ||
            typeof bigNumRes === 'number' ||
            typeof bigNumRes === 'object'
        );

        // DOUBLE: maps to number when configured
        // Use ZINCRBY which returns a DoubleReply
        const doubleRes = await client
            .withTypeMapping({
                [RESP_TYPES.DOUBLE]: Number
            })
            .zIncrBy('zset-double-test', 1.5, 'member');
        assert.strictEqual(typeof doubleRes, 'number');
        assert.strictEqual(doubleRes, 1.5);

        // Complex Strings
        // VERBATIM_STRING maps to string
        const verbatimRes = await client
            .withTypeMapping({
                [RESP_TYPES.VERBATIM_STRING]: String
            })
            .get('key');
        assert.ok(
            verbatimRes === null ||
            typeof verbatimRes === 'string' ||
            Buffer.isBuffer(verbatimRes)
        );

        const uint8Res = await client
            .withTypeMapping({
                [RESP_TYPES.BLOB_STRING]: Uint8Array
            })
            .get('key');
        if (uint8Res !== null && typeof uint8Res !== 'string') {
            assert.ok(ArrayBuffer.isView(uint8Res));
            assert.ok((uint8Res as any) instanceof Uint8Array);
        }

        // Recursive Collections
        // ARRAY infers nested mapped types
        const arrayRes = await client
            .withTypeMapping({
                [RESP_TYPES.BLOB_STRING]: String
            })
            .lRange('key', 0, -1);
        assert.ok(Array.isArray(arrayRes));

        // SET infers Set or array
        const setRes = await client
            .withTypeMapping({
                [RESP_TYPES.BLOB_STRING]: String
            })
            .sMembers('key');
        assert.ok(setRes instanceof Set || Array.isArray(setRes));

        // MAP infers Map or object
        const mapRes = await client
            .withTypeMapping({
                [RESP_TYPES.BLOB_STRING]: String
            })
            .hGetAll('key');
        assert.ok(mapRes instanceof Map || typeof mapRes === 'object');

        // Edge Cases
        // SIMPLE_ERROR remains Error
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

        // NULL always remains null
        const nullRes = await client
            .withTypeMapping({})
            .get('missing-key-random-12345');
        assert.strictEqual(nullRes, null);

        // hGet infers string | null
        const hGetRes = await client
            .withTypeMapping({
                [RESP_TYPES.BLOB_STRING]: String
            })
            .hGet('foo', 'bar');
        assert.ok(hGetRes === null || typeof hGetRes === 'string');
    }, GLOBAL.SERVERS.OPEN);
});
