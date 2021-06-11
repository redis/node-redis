import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './HGET';

describe('HGET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'field'),
            ['HGET', 'key', 'field']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hGet', async client => {
        assert.equal(
            await client.hGet('key', 'field'),
            null
        );
    });
});
