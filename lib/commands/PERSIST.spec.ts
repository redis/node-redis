import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './PERSIST';

describe('PERSIST', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['PERSIST', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.persist', async client => {
        assert.equal(
            await client.persist('key'),
            false
        );
    });
});
