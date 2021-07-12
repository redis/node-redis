import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './ZRANDMEMBER';

describe('ZRANDMEMBER', () => {
    describeHandleMinimumRedisVersion([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['ZRANDMEMBER', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zRandMember', async client => {
        assert.equal(
            await client.zRandMember('key'),
            null
        );
    });
});
