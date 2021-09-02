import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './HKEYS';

describe('HKEYS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['HKEYS', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hKeys', async client => {
        assert.deepEqual(
            await client.hKeys('key'),
            []
        );
    });
});
