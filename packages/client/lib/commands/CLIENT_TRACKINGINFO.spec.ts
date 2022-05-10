import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLIENT_TRACKINGINFO';

describe('CLIENT TRACKINGINFO', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLIENT', 'TRACKINGINFO']
        );
    });

    testUtils.testWithClient('client.clientTrackingInfo', async client => {
        assert.deepEqual(
            await client.clientTrackingInfo(),
            {
                flags: new Set(['off']),
                redirect: -1,
                prefixes: []
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
