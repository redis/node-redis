import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZLEXCOUNT';

describe('ZLEXCOUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', '[a', '[b'),
            ['ZLEXCOUNT', 'key', '[a', '[b']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zLexCount', async client => {
        assert.equal(
            await client.zLexCount('key', '[a', '[b'),
            0
        );
    });
});
