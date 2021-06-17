import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './XLEN';

describe('XLEN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['XLEN', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.xLen', async client => {
        assert.equal(
            await client.xLen('key'),
            0
        );
    });
});
