import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './MOVE';

describe('MOVE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['MOVE', 'key', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.move', async client => {
        assert.equal(
            await client.move('key', 1),
            false
        );
    });
});
