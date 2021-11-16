import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HRANDFIELD_COUNT';

describe('HRANDFIELD COUNT', () => {
    testUtils.isVersionGreaterThanHook([6, 2, 5]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['HRANDFIELD', 'key', '1']
        );
    });

    testUtils.testWithClient('client.hRandFieldCount', async client => {
        assert.deepEqual(
            await client.hRandFieldCount('key', 1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
