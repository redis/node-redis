import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PUBLISH';

describe('PUBLISH', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('channel', 'message'),
            ['PUBLISH', 'channel', 'message']
        );
    });

    testUtils.testWithClient('client.publish', async client => {
        assert.equal(
            await client.publish('channel', 'message'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
