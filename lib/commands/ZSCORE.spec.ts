import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZSCORE';

describe('ZSCORE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member'),
            ['ZSCORE', 'key', 'member']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zScore', async client => {
        assert.equal(
            await client.zScore('key', 'member'),
            null
        );
    });
});
