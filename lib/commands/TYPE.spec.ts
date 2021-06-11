import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './TYPE';

describe('TYPE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TYPE', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.type', async client => {
        assert.equal(
            await client.type('key'),
            'none'
        );
    });
});
