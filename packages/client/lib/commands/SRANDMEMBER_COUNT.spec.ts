import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SRANDMEMBER_COUNT';

describe('SRANDMEMBER COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['SRANDMEMBER', 'key', '1']
        );
    });

    testUtils.testWithClient('client.sRandMemberCount', async client => {
        assert.deepEqual(
            await client.sRandMemberCount('key', 1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
