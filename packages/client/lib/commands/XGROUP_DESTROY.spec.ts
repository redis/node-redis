import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XGROUP_DESTROY';

describe('XGROUP DESTROY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'group'),
            ['XGROUP', 'DESTROY', 'key', 'group']
        );
    });

    testUtils.testWithClient('client.xGroupDestroy', async client => {
        await client.xGroupCreate('key', 'group', '$', {
            MKSTREAM: true
        });

        assert.equal(
            await client.xGroupDestroy('key', 'group'),
            true
        );
    }, GLOBAL.SERVERS.OPEN);
});
