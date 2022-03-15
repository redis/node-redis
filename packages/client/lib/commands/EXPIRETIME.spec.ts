import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './EXPIRETIME';

describe('EXPIRETIME', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['EXPIRETIME', 'key']
        );
    });

    testUtils.testWithClient('client.expireTime', async client => {
        testUtils.isVersionGreaterThanHook([7, 0]);
        
        assert.equal(
            await client.expireTime('key'),
            -2
        );
    }, GLOBAL.SERVERS.OPEN);
});
