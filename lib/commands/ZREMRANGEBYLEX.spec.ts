import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZREMRANGEBYLEX';

describe('ZREMRANGEBYLEX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', '[a', '[b'),
            ['ZREMRANGEBYLEX', 'key', '[a', '[b']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zRemRangeByLex', async client => {
        assert.equal(
            await client.zRemRangeByLex('key', '[a', '[b'),
            0
        );
    });
});
