import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './HSTRLEN';

describe('HSTRLEN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'field'),
            ['HSTRLEN', 'key', 'field']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hStrLen', async client => {
        assert.equal(
            await client.hStrLen('key', 'field'),
            0
        );
    });
});
