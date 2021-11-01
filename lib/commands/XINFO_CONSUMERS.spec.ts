import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './XINFO_CONSUMERS';

describe('XINFO CONSUMERS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'group'),
            ['XINFO', 'CONSUMERS', 'key', 'group']
        );
    });

    it('transformReply', () => {
        assert.deepEqual(
            transformReply([
                ['name', 'Alice', 'pending', 1, 'idle', 9104628],
                ['name', 'Bob', 'pending', 1, 'idle', 83841983]
            ]),
            [{
                name: 'Alice',
                pending: 1,
                idle: 9104628
            }, {
                name: 'Bob',
                pending: 1,
                idle: 83841983
            }]
        );
    });

    testUtils.testWithClient('client.xInfoConsumers', async client => {
        await client.xGroupCreate('key', 'group', '$', {
            MKSTREAM: true
        });

        assert.deepEqual(
            await client.xInfoConsumers('key', 'group'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
