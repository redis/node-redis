import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZREVRANK';

describe('ZREVRANK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member'),
            ['ZREVRANK', 'key', 'member']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zRevRank', async client => {
        assert.equal(
            await client.zRevRank('key', 'member'),
            null
        );
    });
});
