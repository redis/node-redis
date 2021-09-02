import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './XGROUP_DELCONSUMER';

describe('XGROUP DELCONSUMER', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'group', 'consumer'),
            ['XGROUP', 'DELCONSUMER', 'key', 'group', 'consumer']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.xGroupDelConsumer', async client => {
        await client.xGroupCreate('key', 'group', '$', {
            MKSTREAM: true
        });
        
        assert.equal(
            await client.xGroupDelConsumer('key', 'group', 'consumer'),
            0
        );
    });
});
