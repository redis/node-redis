import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './EXPIRETIME';

describe('EXPIRETIME', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['EXPIRETIME', 'key']
        );
    });

    testUtils.testWithClient('client.expireTime', async client => {
        assert.equal(
            await client.expireTime('key'),
            -2
        );
    }, GLOBAL.SERVERS.OPEN);
});
