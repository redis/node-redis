import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './HRANDFIELD_COUNT_WITHVALUES';

describe('HRANDFIELD COUNT WITHVALUES', () => {
    describeHandleMinimumRedisVersion([6, 2, 5]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['HRANDFIELD', 'key', '1', 'WITHVALUES']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hRandFieldCountWithValues', async client => {
        assert.deepEqual(
            await client.hRandFieldCountWithValues('key', 1),
            Object.create(null)
        );
    });
});
