import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './XCLAIM_JUSTID';

describe('XCLAIM JUSTID', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'group', 'consumer', 1, '0-0'),
            ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'JUSTID']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.xClaimJustId', async client => {
        await Promise.all([
            client.xGroupCreate('key', 'group', '$', {
                MKSTREAM: true
            }),
            client.xGroupCreateConsumer('key', 'group', 'consumer'),
        ]);
        
        assert.deepEqual(
            await client.xClaimJustId('key', 'group', 'consumer', 1, '0-0'),
            []
        );
    });
});
