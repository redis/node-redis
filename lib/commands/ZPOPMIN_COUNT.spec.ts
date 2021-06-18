import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZPOPMIN_COUNT';

describe('ZPOPMIN COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['ZPOPMIN', 'key', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.zPopMinCount', async client => {
        assert.deepEqual(
            await client.zPopMinCount('key', 1),
            []
        );
    });
});
