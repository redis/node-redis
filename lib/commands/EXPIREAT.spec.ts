import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './EXPIREAT';

describe('EXPIREAT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['EXPIRE', 'key', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.expireAt', async client => {
        assert.equal(
            await client.expireAt('key', 1),
            false
        );
    });
});
