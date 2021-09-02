import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './RANDOMKEY';

describe('RANDOMKEY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['RANDOMKEY']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.randomKey', async client => {
        assert.equal(
            await client.randomKey(),
            null
        );
    });
});
