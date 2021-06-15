import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZPOPMIN';

describe('ZPOPMIN', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['ZPOPMIN', 'key']
            );
        });

        it('with count', () => {
            assert.deepEqual(
                transformArguments('key', 1),
                ['ZPOPMIN', 'key', '1']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.zPopMin', async client => {
        assert.equal(
            await client.zPopMin('key'),
            null
        );
    });
});
