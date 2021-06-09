import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SCARD';

describe('SCARD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['SCARD', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.sCard', async client => {
        assert.equal(
            await client.sCard('key'),
            0
        );
    });
});
