import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XAUTOCLAIM';

describe('XAUTOCLAIM', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 'group', 'consumer', 1, '0-0'),
                ['XAUTOCLAIM', 'key', 'group', 'consumer', '1', '0-0']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('key', 'group', 'consumer', 1, '0-0', {
                    COUNT: 1
                }),
                ['XAUTOCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'COUNT', '1']
            );
        });
    });

    testUtils.testWithClient('client.xAutoClaim', async client => {
        await Promise.all([
            client.xGroupCreate('key', 'group', '$', {
                MKSTREAM: true
            }),
            client.xGroupCreateConsumer('key', 'group', 'consumer'),
        ]);

        assert.deepEqual(
            await client.xAutoClaim('key', 'group', 'consumer', 1, '0-0'),
            {
                nextId: '0-0',
                messages: []
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
