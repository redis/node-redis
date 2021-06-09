import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SMOVE';

describe('SMOVE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('source', 'destination', 'member'),
            ['SMOVE', 'source', 'destination', 'member']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.sMove', async client => {
        assert.equal(
            await client.sMove('source', 'destination', 'member'),
            false
        );
    });
});
