import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZPOPMIN';

describe('ZPOPMIN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['ZPOPMIN', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zPopMin', async client => {
        assert.equal(
            await client.zPopMin('key'),
            null
        );
    });
});
