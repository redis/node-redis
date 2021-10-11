import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SCRIPT_DEBUG';

describe('SCRIPT DEBUG', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('NO'),
            ['SCRIPT', 'DEBUG', 'NO']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.scriptDebug', async client => {
        assert.equal(
            await client.scriptDebug('NO'),
            'OK'
        );
    });
});
