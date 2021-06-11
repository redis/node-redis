import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './BITCOUNT';

describe('BITCOUNT', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['BITCOUNT', 'key']
            );
        });

        it('with range', () => {
            assert.deepEqual(
                transformArguments('key', {
                    start: 0,
                    end: 1
                }),
                ['BITCOUNT', 'key', '0', '1']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.bitCount', async client => {
        assert.equal(
            await client.bitCount('key'),
            0
        );
    });
});
