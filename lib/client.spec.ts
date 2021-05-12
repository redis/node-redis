import { strict as assert } from 'assert';
import { TestRedisServers, TEST_REDIS_SERVERS, itWithClient } from './test-utils';
import RedisClient from './client';

describe('Client', () => {
    describe('authentication', () => {
        itWithClient(TestRedisServers.PASSWORD, 'Client should be authenticated', async client => {
            assert.equal(
                await client.ping(),
                'PONG'
            );
        });

        it('should not retry connecting if failed due to wrong auth', async () => {
            const client = RedisClient.create({
                socket: {
                    ...TEST_REDIS_SERVERS[TestRedisServers.PASSWORD],
                    password: 'wrongpassword'
                }
            });

            await assert.rejects(
                () => client.connect(),
                {
                    message: 'WRONGPASS invalid username-password pair or user is disabled.'
                }
            );

            // TODO validate state
        });
    });

    it('sendCommand', async () => {
        const client = RedisClient.create();

        await client.connect();
        assert.deepEqual(await client.sendCommand(['PING']), 'PONG');
        await client.disconnect();
    });
});