import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './INCR';

describe('INCR', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['INCR', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.incr', async client => {
        assert.equal(
            await client.incr('key'),
            1
        );
    });
});
