import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './PUBLISH';

describe('PUBLISH', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('channel', 'message'),
            ['PUBLISH', 'channel', 'message']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.publish', async client => {
        assert.equal(
            await client.publish('channel', 'message'),
            0
        );
    });
});
