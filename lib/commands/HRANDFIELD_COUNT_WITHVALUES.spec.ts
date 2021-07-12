import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './HRANDFIELD_COUNT_WITHVALUES';

describe('HRANDFIELD COUNT WITHVALUES', () => {
    describeHandleMinimumRedisVersion([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['HRANDFIELD', 'key', '1', 'WITHVALUES']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hRandFieldCountWithValues', async client => {
        assert.equal(
            await client.hRandFieldCountWithValues('key', 1),
            null
        );
    });
});
