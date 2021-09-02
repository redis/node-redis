import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZREMRANGEBYSCORE';

describe('ZREMRANGEBYSCORE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 1),
            ['ZREMRANGEBYSCORE', 'key', '0', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zRemRangeByScore', async client => {
        assert.equal(
            await client.zRemRangeByScore('key', 0, 1),
            0
        );
    });
});
