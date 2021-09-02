import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './ZRANDMEMBER_COUNT_WITHSCORES';

describe('ZRANDMEMBER COUNT WITHSCORES', () => {
    describeHandleMinimumRedisVersion([6, 2, 5]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['ZRANDMEMBER', 'key', '1', 'WITHSCORES']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zRandMemberCountWithScores', async client => {
        assert.deepEqual(
            await client.zRandMemberCountWithScores('key', 1),
            []
        );
    });
});
