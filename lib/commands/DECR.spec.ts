import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './DECR';

describe('DECR', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['DECR', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.decr', async client => {
        assert.equal(
            await client.decr('key'),
            -1
        );
    });
});
