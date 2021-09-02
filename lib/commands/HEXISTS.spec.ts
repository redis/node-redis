import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './HEXISTS';

describe('HEXISTS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'field'),
            ['HEXISTS', 'key', 'field']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hExists', async client => {
        assert.equal(
            await client.hExists('key', 'field'),
            false
        );
    });
});
