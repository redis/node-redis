import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SRANDMEMBER';

describe('SRANDMEMBER', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['SRANDMEMBER', 'key']
        );
    });

    testUtils.testWithClient('client.sRandMember', async client => {
        assert.equal(
            await client.sRandMember('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
