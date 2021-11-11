import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZRANDMEMBER';

describe('ZRANDMEMBER', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['ZRANDMEMBER', 'key']
        );
    });

    testUtils.testWithClient('client.zRandMember', async client => {
        assert.equal(
            await client.zRandMember('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
