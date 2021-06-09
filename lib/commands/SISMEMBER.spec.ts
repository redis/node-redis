import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SISMEMBER';

describe('SISMEMBER', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member'),
            ['SISMEMBER', 'key', 'member']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.sIsMember', async client => {
        assert.equal(
            await client.sIsMember('key', 'member'),
            false
        );
    });
});
