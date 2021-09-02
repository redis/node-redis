import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZCOUNT';

describe('ZCOUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 1),
            ['ZCOUNT', 'key', '0', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zCount', async client => {
        assert.equal(
            await client.zCount('key', 0, 1),
            0
        );
    });
});
