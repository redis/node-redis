import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZRANDMEMBER_COUNT_WITHSCORES';

describe('ZRANDMEMBER COUNT WITHSCORES', () => {
    testUtils.isVersionGreaterThanHook([6, 2, 5]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['ZRANDMEMBER', 'key', '1', 'WITHSCORES']
        );
    });

    testUtils.testWithClient('client.zRandMemberCountWithScores', async client => {
        assert.deepEqual(
            await client.zRandMemberCountWithScores('key', 1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
