import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZINTER';

describe('ZINTER', () => {
    describe('transformArguments', () => {
        it('key (string)', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['ZINTER', '1', 'key']
            );
        });

        it('keys (array)', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['ZINTER', '2', '1', '2']
            );
        });

        it('with WEIGHTS', () => {
            assert.deepEqual(
                transformArguments('key', {
                    WEIGHTS: [1]
                }),
                ['ZINTER', '1', 'key', 'WEIGHTS', '1']
            );
        });

        it('with AGGREGATE', () => {
            assert.deepEqual(
                transformArguments('key', {
                    AGGREGATE: 'SUM'
                }),
                ['ZINTER', '1', 'key', 'AGGREGATE', 'SUM']
            );
        });

        it('with WEIGHTS, AGGREGATE', () => {
            assert.deepEqual(
                transformArguments('key', {
                    WEIGHTS: [1],
                    AGGREGATE: 'SUM'
                }),
                ['ZINTER', '1', 'key', 'WEIGHTS', '1', 'AGGREGATE', 'SUM']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.zInter', async client => {
        assert.deepEqual(
            await client.zInter('key'),
            []
        );
    });
});
