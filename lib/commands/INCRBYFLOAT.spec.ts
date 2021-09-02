import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './INCRBYFLOAT';

describe('INCRBYFLOAT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1.5),
            ['INCRBYFLOAT', 'key', '1.5']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.incrByFloat', async client => {
        assert.equal(
            await client.incrByFloat('key', 1.5),
            '1.5'
        );
    });
});
