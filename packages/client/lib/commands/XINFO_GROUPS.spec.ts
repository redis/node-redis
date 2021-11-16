import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './XINFO_GROUPS';

describe('XINFO GROUPS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['XINFO', 'GROUPS', 'key']
        );
    });

    it('transformReply', () => {
        assert.deepEqual(
            transformReply([
                ['name', 'mygroup', 'consumers', 2, 'pending', 2, 'last-delivered-id', '1588152489012-0'],
                ['name', 'some-other-group', 'consumers', 1, 'pending', 0, 'last-delivered-id', '1588152498034-0']
            ]),
            [{
                name: 'mygroup',
                consumers: 2,
                pending: 2,
                lastDeliveredId: '1588152489012-0'
            }, {
                name: 'some-other-group',
                consumers: 1,
                pending: 0,
                lastDeliveredId: '1588152498034-0'
            }]
        );
    });

    testUtils.testWithClient('client.xInfoGroups', async client => {
        await client.xGroupCreate('key', 'group', '$', {
            MKSTREAM: true
        });

        assert.deepEqual(
            await client.xInfoGroups('key'),
            [{
                name: 'group',
                consumers: 0,
                pending: 0,
                lastDeliveredId: '0-0'
            }]
        );
    }, GLOBAL.SERVERS.OPEN);
});
