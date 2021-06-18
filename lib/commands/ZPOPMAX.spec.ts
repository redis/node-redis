import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZPOPMAX';

describe('ZPOPMAX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['ZPOPMAX', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zPopMax', async client => {
        assert.equal(
            await client.zPopMax('key'),
            null
        );
    });
});
