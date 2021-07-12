import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './HRANDFIELD';

describe('HRANDFIELD', () => {
    describeHandleMinimumRedisVersion([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['HRANDFIELD', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hRandField', async client => {
        assert.equal(
            await client.hRandField('key'),
            null
        );
    });
});
