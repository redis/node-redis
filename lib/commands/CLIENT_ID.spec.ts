import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './CLIENT_ID';

describe('CLIENT ID', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLIENT', 'ID']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.clientId', async client => {
        assert.equal(
            typeof (await client.clientId()),
            'number'
        );
    });
});
