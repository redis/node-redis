import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLIENT_ID';

describe('CLIENT ID', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLIENT', 'ID']
        );
    });

    testUtils.testWithClient('client.clientId', async client => {
        assert.equal(
            typeof (await client.clientId()),
            'number'
        );
    }, GLOBAL.SERVERS.OPEN);
});
