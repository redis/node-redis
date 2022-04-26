import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PEXPIRETIME';

describe('PEXPIRETIME', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['PEXPIRETIME', 'key']
        );
    });

    testUtils.testWithClient('client.pExpireTime', async client => {
        assert.equal(
            await client.pExpireTime('key'),
            -2
        );
    }, GLOBAL.SERVERS.OPEN);
});
