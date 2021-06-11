import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './HLEN';

describe('HLEN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['HLEN', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hLen', async client => {
        assert.equal(
            await client.hLen('key'),
            0
        );
    });
});
