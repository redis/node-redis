import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';

describe('DUMP', () => {
    itWithClient(TestRedisServers.OPEN, 'client.dump', async client => {
        assert.equal(
            await client.dump('key'),
            null
        );
    });
});
