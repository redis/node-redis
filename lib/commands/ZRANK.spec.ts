import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZRANK';

describe('ZRANK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member'),
            ['ZRANK', 'key', 'member']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zRank', async client => {
        assert.equal(
            await client.zRank('key', 'member'),
            null
        );
    });
});
