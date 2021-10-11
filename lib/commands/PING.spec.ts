import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';

describe('PING', () => {
    itWithClient(TestRedisServers.OPEN, 'client.ping', async client => {
        assert.equal(
            await client.ping(),
            'PONG'
        );
    });
});
