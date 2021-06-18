import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZPOPMAX_COUNT';

describe('ZPOPMAX COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['ZPOPMAX', 'key', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zPopMaxCount', async client => {
        assert.deepEqual(
            await client.zPopMaxCount('key', 1),
            []
        );
    });
});
