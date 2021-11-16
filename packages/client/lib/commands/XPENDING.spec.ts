import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
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

    testUtils.testWithClient('client.xPending', async client => {
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
    }, GLOBAL.SERVERS.OPEN);
});
