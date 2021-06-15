import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZCARD';

describe('ZCARD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['ZCARD', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zCard', async client => {
        assert.equal(
            await client.zCard('key'),
            0
        );
    });
});
