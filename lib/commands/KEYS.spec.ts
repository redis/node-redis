import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils.js';

describe('KEYS', () => {
    itWithClient(TestRedisServers.OPEN, 'client.keys', async client => {
        assert.deepEqual(
            await client.keys('pattern'),
            []
        );
    });
});
