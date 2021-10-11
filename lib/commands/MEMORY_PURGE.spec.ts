import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './MEMORY_PURGE';

describe('MEMORY PURGE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['MEMORY', 'PURGE']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.memoryPurge', async client => {
        assert.equal(
            await client.memoryPurge(),
            'OK'
        );
    });
});
