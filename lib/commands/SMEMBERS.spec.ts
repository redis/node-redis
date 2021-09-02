import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SMEMBERS';

describe('SMEMBERS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['SMEMBERS', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.sMembers', async client => {
        assert.deepEqual(
            await client.sMembers('key'),
            []
        );
    });
});
