import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './HINCRBY';

describe('HINCRBY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'field', 1),
            ['HINCRBY', 'key', 'field', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hIncrBy', async client => {
        assert.equal(
            await client.hIncrBy('key', 'field', 1),
            1
        );
    });
});
