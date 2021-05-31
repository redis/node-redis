import { strict as assert } from 'assert';
import { once } from 'events';
import { itWithClient, TEST_REDIS_SERVERS, TestRedisServers } from './test-utils';
import RedisClient from './client';
import { AbortError } from './errors';
import { defineScript } from './lua-script';

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

    describe('callbackify', () => {
        const client = RedisClient.create({
            socket: TEST_REDIS_SERVERS[TestRedisServers.OPEN],
            callbackify: true
        });

        before(() => client.connect());
        after(async () => {
            await (client as any).flushAllAsync();
            await client.disconnect();
        });

        it('client.{command} should call the callback', done => {
            (client as any).ping((err: Error, reply: string) => {
                if (err) {
                    return done(err);
                }

                try {
                    assert.equal(reply, 'PONG');
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });

        it('client.{command} should work without callback', async () => {
            (client as any).ping();
            await (client as any).pingAsync(); // make sure the first command was replied
        });

        it('client.{command}Async should return a promise', async () => {
            assert.equal(
                await (client as any).pingAsync(),
                'PONG'
            );
        });
    });

    describe('events', () => {
        it('connect, ready, end', async () => {
            const client = RedisClient.create({
                socket: TEST_REDIS_SERVERS[TestRedisServers.OPEN]
            });

            await Promise.all([
                client.connect(),
                once(client, 'connect'),
                once(client, 'ready')
            ]);

            await Promise.all([
                client.disconnect(),
                once(client, 'end')
            ]);
        });
    });

    describe('sendCommand', () => {
        itWithClient(TestRedisServers.OPEN, 'PING', async client => {
            assert.equal(await client.sendCommand(['PING']), 'PONG');
        });

        describe('AbortController', () => {
            itWithClient(TestRedisServers.OPEN, 'success', async client => {
                await client.sendCommand(['PING'], {
                    signal: new AbortController().signal
                });
            });

            itWithClient(TestRedisServers.OPEN, 'AbortError', async client => {
                const controller = new AbortController();
                controller.abort();

                await assert.rejects(
                    client.sendCommand(['PING'], {
                        signal: controller.signal
                    }),
                    AbortError
                );
            });
        });
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

        itWithClient(TestRedisServers.OPEN, 'should reject the whole chain on error', async client => {
            client.on('error', () => {
                // ignore errors
            });

            await assert.rejects(
                client.multi()
                    .ping()
                    .addCommand(['DEBUG', 'RESTART'])
                    .ping()
                    .exec()
            );
        });

        it('with script', async () => {
            const client = RedisClient.create({
                scripts: {
                    add: defineScript({
                        NUMBER_OF_KEYS: 0,
                        SCRIPT: 'return ARGV[1] + 1;',
                        transformArguments(number: number): Array<string> {
                            return [number.toString()];
                        },
                        transformReply(reply: number): number {
                            return reply;
                        }
                    })
                }
            });
    
            await client.connect();

            try {
                assert.deepEqual(
                    await client.multi()
                        .add(1)
                        .exec(),
                    [2]
                );
            } finally {
                await client.disconnect();
            }
        });
    });
    
    it('scripts', async () => {
        const client = RedisClient.create({
            scripts: {
                add: defineScript({
                    NUMBER_OF_KEYS: 0,
                    SCRIPT: 'return ARGV[1] + 1;',
                    transformArguments(number: number): Array<string> {
                        return [number.toString()];
                    },
                    transformReply(reply: number): number {
                        return reply;
                    }
                })
            }
        });

        await client.connect();

        try {
            assert.equal(
                await client.add(1),
                2
            );
        } finally {
            await client.disconnect();
        }
    });

    itWithClient(TestRedisServers.OPEN, 'should reconnect after DEBUG RESTART', async client => {
        client.on('error', () => {
            // ignore errors
        });

        await client.sendCommand(['CLIENT', 'SETNAME', 'client']);
        await assert.rejects(client.sendCommand(['DEBUG', 'RESTART']));
        assert.ok(await client.sendCommand(['CLIENT', 'GETNAME']) === null);
    });

    itWithClient(TestRedisServers.OPEN, 'should SELECT db after reconnection', async client => {
        client.on('error', () => {
            // ignore errors
        });

        await client.select(1);
        await assert.rejects(client.sendCommand(['DEBUG', 'RESTART']));
        assert.equal(
            (await client.clientInfo()).db,
            1
        );
    });
});