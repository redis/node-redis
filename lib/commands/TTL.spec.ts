import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './TTL';

describe('TTL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TTL', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.ttl', async client => {
        assert.equal(
            await client.ttl('key'),
            -2
        );
    });
});
