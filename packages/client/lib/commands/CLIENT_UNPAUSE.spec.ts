import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLIENT_UNPAUSE';

describe('ACL CAT', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLIENT', 'UNPAUSE']
        );
    });

    testUtils.testWithClient('client.unpause', async client => {
        assert.equal(
            client.clientUnpause(),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
