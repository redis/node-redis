import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './EXPIRE';

describe('EXPIRE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['EXPIRE', 'key', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.expire', async client => {
        assert.equal(
            await client.expire('key', 0),
            false
        );
    });
});
