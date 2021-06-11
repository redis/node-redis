import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './PTTL';

describe('PTTL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['PTTL', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.pTTL', async client => {
        assert.equal(
            await client.pTTL('key'),
            -2
        );
    });
});
