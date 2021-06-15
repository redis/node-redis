import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZPOPMAX';

describe('ZPOPMAX', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['ZPOPMAX', 'key']
            );
        });

        it('with count', () => {
            assert.deepEqual(
                transformArguments('key', 1),
                ['ZPOPMAX', 'key', '1']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.zPopMax', async client => {
        assert.equal(
            await client.zPopMax('key'),
            null
        );
    });
});
