import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './XPENDING';

describe('XPENDING', () => {
    describe('transformArguments', () => {
        it('transformArguments', () => {
            assert.deepEqual(
                transformArguments('key', 'group'),
                ['XPENDING', 'key', 'group']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.xPending', async client => {
        await client.xGroupCreate('key', 'group', '$', {
            MKSTREAM: true
        });

        assert.deepEqual(
            await client.xPending('key', 'group'),
            {
                pending: 0,
                firstId: null,
                lastId: null,
                consumers: null
            }
        );
    });
});
