import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './XGROUP_CREATECONSUMER';

describe('XGROUP CREATECONSUMER', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'group', 'consumer'),
            ['XGROUP', 'CREATECONSUMER', 'key', 'group', 'consumer']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.xGroupCreateConsumer', async client => {
        await client.xGroupCreate('key', 'group', '$', {
            MKSTREAM: true
        });
        
        assert.equal(
            await client.xGroupCreateConsumer('key', 'group', 'consumer'),
            true
        );
    });
});
