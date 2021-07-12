import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './ZUNION';

describe('ZUNION', () => {
    describeHandleMinimumRedisVersion([6, 2]);

    describe('transformArguments', () => {
        it('key (string)', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['ZUNION', '1', 'key']
            );
        });

        it('keys (array)', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['ZUNION', '2', '1', '2']
            );
        });

        it('with WEIGHTS', () => {
            assert.deepEqual(
                transformArguments('key', {
                    WEIGHTS: [1]
                }),
                ['ZUNION', '1', 'key', 'WEIGHTS', '1']
            );
        });

        it('with AGGREGATE', () => {
            assert.deepEqual(
                transformArguments('key', {
                    AGGREGATE: 'SUM'
                }),
                ['ZUNION', '1', 'key', 'AGGREGATE', 'SUM']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.zUnion', async client => {
        assert.deepEqual(
            await client.zUnion('key'),
            []
        );
    });
});
