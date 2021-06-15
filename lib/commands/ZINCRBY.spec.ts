import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZINCRBY';

describe('ZINCRBY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1, 'member'),
            ['ZINCRBY', 'key', '1', 'member']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zIncrBy', async client => {
        assert.equal(
            await client.zIncrBy('destination', 1, 'member'),
            1
        );
    });
});
