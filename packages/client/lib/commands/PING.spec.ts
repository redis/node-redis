import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import RedisClient from '../client';

describe('PING', () => {
    describe('client.ping', () => {
        testUtils.testWithClient('string', async client => {
            assert.equal(
                await client.ping(),
                'PONG'
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('buffer', async client => {
            assert.deepEqual(
                await client.ping(RedisClient.commandOptions({ returnBuffers: true })),
                Buffer.from('PONG')
            );
        }, GLOBAL.SERVERS.OPEN);
    });
});
