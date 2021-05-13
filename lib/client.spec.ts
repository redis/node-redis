import { strict as assert } from 'assert';
import { once } from 'events';
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
                client.connect(),
                {
                    message: 'WRONGPASS invalid username-password pair or user is disabled.'
                }
            );

            assert.equal(client.isOpen, false);
        });
    });

    describe('events', () => {
        it('connect, ready, end', async () => {
            const client = RedisClient.create({
                socket: TEST_REDIS_SERVERS[TestRedisServers.OPEN]
            });

            await Promise.all([
                assert.doesNotReject(client.connect()),
                assert.doesNotReject(once(client, 'connect')),
                assert.doesNotReject(once(client, 'ready'))
            ]);

            await Promise.all([
                assert.doesNotReject(client.disconnect()),
                assert.doesNotReject(once(client, 'end'))
            ]);
        });
    });

    it('sendCommand', async () => {
        const client = RedisClient.create({
            socket: TEST_REDIS_SERVERS[TestRedisServers.OPEN]
        });

        await client.connect();
        assert.equal(await client.sendCommand(['PING']), 'PONG');
        await client.disconnect();
    });

    describe('multi', () => {
        itWithClient(TestRedisServers.OPEN, 'simple', async client => {
            assert.deepEqual(
                await client.multi()
                    .ping()
                    .set('key', 'value')
                    .get('key')
                    .exec(),
                ['PONG', 'OK', 'value']
            );
        });
    });
});