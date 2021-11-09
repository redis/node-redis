import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SISMEMBER';

describe('SISMEMBER', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member'),
            ['SISMEMBER', 'key', 'member']
        );
    });

    testUtils.testWithClient('client.sIsMember', async client => {
        assert.equal(
            await client.sIsMember('key', 'member'),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});
