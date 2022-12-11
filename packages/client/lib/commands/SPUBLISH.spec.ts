import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SPUBLISH';

describe('SPUBLISH', () => {
    testUtils.isVersionGreaterThanHook([7]);
    
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('channel', 'message'),
            ['SPUBLISH', 'channel', 'message']
        );
    });

    testUtils.testWithClient('client.sPublish', async client => {
        assert.equal(
            await client.sPublish('channel', 'message'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
