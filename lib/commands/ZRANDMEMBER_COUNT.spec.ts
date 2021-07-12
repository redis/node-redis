import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './ZRANDMEMBER_COUNT';

describe('ZRANDMEMBER COUNT', () => {
    describeHandleMinimumRedisVersion([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['ZRANDMEMBER', 'key', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zRandMemberCount', async client => {
        assert.equal(
            await client.zRandMemberCount('key', 1),
            null
        );
    });
});
