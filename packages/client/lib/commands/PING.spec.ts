import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';

describe('PING', () => {
    testUtils.testWithClient('client.ping', async client => {
        assert.equal(
            await client.ping(),
            'PONG'
        );
    }, GLOBAL.SERVERS.OPEN);
});
