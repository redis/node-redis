import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './PEXPIREAT';

describe('PEXPIREAT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['PEXPIREAT', 'key', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.pExpireAt', async client => {
        assert.equal(
            await client.pExpireAt('key', 1),
            false
        );
    });
});
