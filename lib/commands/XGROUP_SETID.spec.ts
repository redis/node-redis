import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './XGROUP_SETID';

describe('XGROUP SETID', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'group', '0'),
            ['XGROUP', 'SETID', 'key', 'group', '0']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.xGroupSetId', async client => {
        await client.xGroupCreate('key', 'group', '$', {
            MKSTREAM: true
        });

        assert.equal(
            await client.xGroupSetId('key', 'group', '0'),
            'OK'
        );
    });
});
