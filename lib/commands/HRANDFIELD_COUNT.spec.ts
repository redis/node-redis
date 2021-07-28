import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './HRANDFIELD_COUNT';

describe('HRANDFIELD COUNT', () => {
    describeHandleMinimumRedisVersion([6, 2, 5]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['HRANDFIELD', 'key', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hRandFieldCount', async client => {
        assert.deepEqual(
            await client.hRandFieldCount('key', 1),
            []
        );
    });
});
