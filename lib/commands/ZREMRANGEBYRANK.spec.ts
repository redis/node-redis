import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZREMRANGEBYRANK';

describe('ZREMRANGEBYRANK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 1),
            ['ZREMRANGEBYRANK', 'key', '0', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zRemRangeByRank', async client => {
        assert.equal(
            await client.zRemRangeByRank('key', 0, 1),
            0
        );
    });
});
