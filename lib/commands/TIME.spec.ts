import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './TIME';

describe('TIME', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['TIME']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.time', async client => {
        const reply = await client.time();
        assert.ok(reply instanceof Date);
        assert.ok(typeof reply.microseconds === 'number');
    });
});
