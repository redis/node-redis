import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils.js';
import { transformArguments } from './DECRBY.js';

describe('DECRBY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 2),
            ['DECRBY', 'key', '2']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.decrBy', async client => {
        assert.equal(
            await client.decrBy('key', 2),
            -2
        );
    });
});
