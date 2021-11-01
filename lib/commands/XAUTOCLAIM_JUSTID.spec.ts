import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XAUTOCLAIM_JUSTID';

describe('XAUTOCLAIM JUSTID', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'group', 'consumer', 1, '0-0'),
            ['XAUTOCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'JUSTID']
        );
    });

    testUtils.testWithClient('client.xAutoClaimJustId', async client => {
        await Promise.all([
            client.xGroupCreate('key', 'group', '$', {
                MKSTREAM: true
            }),
            client.xGroupCreateConsumer('key', 'group', 'consumer'),
        ]);

        assert.deepEqual(
            await client.xAutoClaimJustId('key', 'group', 'consumer', 1, '0-0'),
            {
                nextId: '0-0',
                messages: []
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
