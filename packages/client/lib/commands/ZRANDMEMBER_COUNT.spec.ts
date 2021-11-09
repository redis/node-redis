import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZRANDMEMBER_COUNT';

describe('ZRANDMEMBER COUNT', () => {
    testUtils.isVersionGreaterThanHook([6, 2, 5]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['ZRANDMEMBER', 'key', '1']
        );
    });

    testUtils.testWithClient('client.zRandMemberCount', async client => {
        assert.deepEqual(
            await client.zRandMemberCount('key', 1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
