import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SRANDMEMBER_COUNT';

describe('SRANDMEMBER COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['SRANDMEMBER', 'key', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.sRandMemberCount', async client => {
        assert.deepEqual(
            await client.sRandMemberCount('key', 1),
            []
        );
    });
});
