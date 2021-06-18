import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZRANDMEMBER';

describe('ZRANDMEMBER', () => {
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
