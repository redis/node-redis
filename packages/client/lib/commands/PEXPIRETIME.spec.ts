import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PEXPIRETIME';

describe('PEXPIRETIME', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['PEXPIRETIME', 'key']
        );
    });

    testUtils.testWithClient('client.pExpireTime', async client => {
        testUtils.isVersionGreaterThanHook([7, 0]);
        
        assert.equal(
            await client.pExpireTime('key'),
            -2
        );
    }, GLOBAL.SERVERS.OPEN);
});
