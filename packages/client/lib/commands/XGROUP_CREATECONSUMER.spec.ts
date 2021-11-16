import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XGROUP_CREATECONSUMER';

describe('XGROUP CREATECONSUMER', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'group', 'consumer'),
            ['XGROUP', 'CREATECONSUMER', 'key', 'group', 'consumer']
        );
    });

    testUtils.testWithClient('client.xGroupCreateConsumer', async client => {
        await client.xGroupCreate('key', 'group', '$', {
            MKSTREAM: true
        });

        assert.equal(
            await client.xGroupCreateConsumer('key', 'group', 'consumer'),
            true
        );
    }, GLOBAL.SERVERS.OPEN);
});
