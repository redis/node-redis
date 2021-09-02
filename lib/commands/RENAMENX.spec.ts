import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './RENAMENX';

describe('RENAMENX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('from', 'to'),
            ['RENAMENX', 'from', 'to']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.renameNX', async client => {
        await client.set('from', 'value');

        assert.equal(
            await client.renameNX('from', 'to'),
            true
        );
    });
});
