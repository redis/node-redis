import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './HRANDFIELD_COUNT';

describe('HRANDFIELD COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['HRANDFIELD', 'key', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hRandFieldCount', async client => {
        assert.equal(
            await client.hRandFieldCount('key', 1),
            null
        );
    });
});
