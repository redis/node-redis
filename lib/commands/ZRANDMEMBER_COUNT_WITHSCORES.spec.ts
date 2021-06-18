import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZRANDMEMBER_COUNT_WITHSCORES';

describe('ZRANDMEMBER COUNT WITHSCORES', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['ZRANDMEMBER', 'key', '1', 'WITHSCORES']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zRandMemberCountWithScores', async client => {
        assert.equal(
            await client.zRandMemberCountWithScores('key', 1),
            null
        );
    });
});
