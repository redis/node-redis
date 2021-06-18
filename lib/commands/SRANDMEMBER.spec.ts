import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SRANDMEMBER';

describe('SRANDMEMBER', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['SRANDMEMBER', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.sRandMember', async client => {
        assert.equal(
            await client.sRandMember('key'),
            null
        );
    });
});
