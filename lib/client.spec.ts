import { strict as assert } from 'assert';
import { once } from 'events';
import { itWithClient, TEST_REDIS_SERVERS, TestRedisServers, waitTillBeenCalled, isRedisVersionGreaterThan } from './test-utils';
import RedisClient, { RedisClientLegacyModes } from './client';
import { AbortError } from './errors';
import { defineScript } from './lua-script';
import { spy } from 'sinon';

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

                    message: isRedisVersionGreaterThan([6]) ?
                        'WRONGPASS invalid username-password pair or user is disabled.' :
                        'ERR invalid password'
                }
            );

            assert.equal(client.isOpen, false);
        });
    });

    describe('legacyMode', () => {
        describe('Mode testing', () => {
            it('legacyMode=off throws on .v4 usage', async () => {
                const client = RedisClient.create({
                    socket: TEST_REDIS_SERVERS[TestRedisServers.OPEN],
                    modules: {
                        testModule: {
                            echo: {
                                transformArguments(message: string): Array<string> {
                                    return ['ECHO', message];
                                },
                                transformReply(reply: string): string {
                                    return reply;
                                }
                            }
                        }
                    },
                    legacyMode: RedisClientLegacyModes.off
                });

                assert.throws(() => { client.v4.PING() });
            });

            it('legacyMode=undefined throws on .v4 usage', async () => {
                const client = RedisClient.create({
                    socket: TEST_REDIS_SERVERS[TestRedisServers.OPEN],
                    modules: {
                        testModule: {
                            echo: {
                                transformArguments(message: string): Array<string> {
                                    return ['ECHO', message];
                                },
                                transformReply(reply: string): string {
                                    return reply;
                                }
                            }
                        }
                    }
                });

                assert.throws(() => { client.v4.PING() });
            })

            it('legacyMode=off throws on attempted callback', (done) => {
                const client = RedisClient.create({
                    socket: TEST_REDIS_SERVERS[TestRedisServers.OPEN],
                    modules: {
                        testModule: {
                            echo: {
                                transformArguments(message: string): Array<string> {
                                    return ['ECHO', message];
                                },
                                transformReply(reply: string): string {
                                    return reply;
                                }
                            }
                        }
                    },
                    legacyMode: RedisClientLegacyModes.off
                });

                client.once("error", (...args) => {
                    if (args[0] == "Legacy command detected. See https://github.com/NodeRedis/node-redis/tree/v4#legacy-mode")
                        done();
                })

                assert.throws(() => {
                    (client as any).sendCommand(["echo", "test", (error: any, reply: any) => { return; }])
                });
            });

            it('legacyMode=undefined throws on attempted callback', (done) => {
                const client = RedisClient.create({
                    socket: TEST_REDIS_SERVERS[TestRedisServers.OPEN],
                    modules: {
                        testModule: {
                            echo: {
                                transformArguments(message: string): Array<string> {
                                    return ['ECHO', message];
                                },
                                transformReply(reply: string): string {
                                    return reply;
                                }
                            }
                        }
                    }
                });

                client.once("error", (...args) => {
                    if (args[0] == "Legacy command detected. See https://github.com/NodeRedis/node-redis/tree/v4#legacy-mode")
                        done();
                })

                assert.throws(() => {
                    (client as any).sendCommand(["echo", "test", (error: any, reply: any) => { return; }])
                });
            });

            it('legacyMode=warn warns', async (done) => {
                const client = RedisClient.create({
                    socket: TEST_REDIS_SERVERS[TestRedisServers.OPEN],
                    modules: {
                        testModule: {
                            echo: {
                                transformArguments(message: string): Array<string> {
                                    return ['ECHO', message];
                                },
                                transformReply(reply: string): string {
                                    return reply;
                                }
                            }
                        }
                    },
                    legacyMode: RedisClientLegacyModes.warn
                });

                client.once('warning', () => {
                    done();
                });

                (client as any).sendCommand('PING', (error: any, reply: any) => { return });
            });

            it('legacyMode=nowarn doesn\'t warn', async () => {
                const client = RedisClient.create({
                    socket: TEST_REDIS_SERVERS[TestRedisServers.OPEN],
                    modules: {
                        testModule: {
                            echo: {
                                transformArguments(message: string): Array<string> {
                                    return ['ECHO', message];
                                },
                                transformReply(reply: string): string {
                                    return reply;
                                }
                            }
                        }
                    },
                    legacyMode: RedisClientLegacyModes.nowarn
                });

                let warned = false;

                client.once('warning', () => {
                    warned = true;
                });

                (client as any).sendCommand('PING', (error: any, reply: any) => { assert(warned == false, "Warning was emitted") });
            });
        })

        describe('Behaviour Testing', () => {
            const client = RedisClient.create({
                socket: TEST_REDIS_SERVERS[TestRedisServers.OPEN],
                modules: {
                    testModule: {
                        echo: {
                            transformArguments(message: string): Array<string> {
                                return ['ECHO', message];
                            },
                            transformReply(reply: string): string {
                                return reply;
                            }
                        }
                    }
                },
                legacyMode: RedisClientLegacyModes.nowarn
            });

            before(() => client.connect());
            afterEach(() => client.v4.flushAll());
            after(() => client.disconnect());

            it('client.sendCommand should call the callback', done => {
                (client as any).sendCommand('PING', (err?: Error, reply?: string) => {
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

            it('client.sendCommand should work without callback', async () => {
                (client as any).sendCommand('PING');
                await client.v4.ping(); // make sure the first command was replied
            });

            it('client.v4.sendCommand should return a promise', async () => {
                assert.equal(
                    await client.v4.sendCommand(['PING']),
                    'PONG'
                );
            });

            it('client.{command} should accept vardict arguments', done => {
                (client as any).set('a', 'b', (err?: Error, reply?: string) => {
                    if (err) {
                        return done(err);
                    }

                    try {
                        assert.equal(reply, 'OK');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });

            it('client.{command} should accept arguments array', done => {
                (client as any).set(['a', 'b'], (err?: Error, reply?: string) => {
                    if (err) {
                        return done(err);
                    }

                    try {
                        assert.equal(reply, 'OK');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });

            it('client.{command} should accept mix of strings and array of strings', done => {
                (client as any).set(['a'], 'b', ['XX'], (err?: Error, reply?: string) => {
                    if (err) {
                        return done(err);
                    }

                    try {
                        assert.equal(reply, null);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });

            it('client.multi.ping.exec should call the callback', done => {
                (client as any).multi()
                    .ping()
                    .exec((err?: Error, reply?: string) => {
                        if (err) {
                            return done(err);
                        }

                        try {
                            assert.deepEqual(reply, ['PONG']);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
            });

            it('client.multi.ping.exec should work without callback', async () => {
                (client as any).multi()
                    .ping()
                    .exec();
                await client.v4.ping(); // make sure the first command was replied
            });

            it('client.multi.ping.v4.ping.v4.exec should return a promise', async () => {
                assert.deepEqual(
                    await ((client as any).multi()
                        .ping()
                        .v4.ping()
                        .v4.exec()),
                    ['PONG', 'PONG']
                );
            });

            it('client.testModule.echo should call the callback', done => {
                (client as any).testModule.echo('message', (err?: Error, reply?: string) => {
                    if (err) {
                        return done(err);
                    }

                    try {
                        assert.deepEqual(reply, 'message');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });

            it('client.v4.testModule.echo should return a promise', async () => {
                assert.equal(
                    await (client as any).v4.testModule.echo('message'),
                    'message'
                );
            });

            it('client.multi.testModule.echo.v4.testModule.echo.exec should call the callback', done => {
                (client as any).multi()
                    .testModule.echo('message')
                    .v4.testModule.echo('message')
                    .exec((err?: Error, replies?: Array<string>) => {
                        if (err) {
                            return done(err);
                        }

                        try {
                            assert.deepEqual(replies, ['message', 'message']);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
            });

            it('client.multi.testModule.echo.v4.testModule.echo.v4.exec should return a promise', async () => {
                assert.deepEqual(
                    await ((client as any).multi()
                        .testModule.echo('message')
                        .v4.testModule.echo('message')
                        .v4.exec()),
                    ['message', 'message']
                );
            });
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
            before(function () {
                if (!global.AbortController) {
                    this.skip();
                }
            });

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
                            assert.equal(number, 1);
                            return [number.toString()];
                        },
                        transformReply(reply: number): number {
                            assert.equal(reply, 2);
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
                        assert.equal(number, 1);
                        return [number.toString()];
                    },
                    transformReply(reply: number): number {
                        assert.equal(reply, 2);
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
    }, {
        // because of CLIENT INFO
        minimumRedisVersion: [6, 2]
    });

    itWithClient(TestRedisServers.OPEN, 'scanIterator', async client => {
        const promises = [],
            keys = new Set();
        for (let i = 0; i < 100; i++) {
            const key = i.toString();
            keys.add(key);
            promises.push(client.set(key, ''));
        }

        await Promise.all(promises);

        const results = new Set();
        for await (const key of client.scanIterator()) {
            results.add(key);
        }

        assert.deepEqual(keys, results);
    });

    itWithClient(TestRedisServers.OPEN, 'hScanIterator', async client => {
        const hash: Record<string, string> = {};
        for (let i = 0; i < 100; i++) {
            hash[i.toString()] = i.toString();
        }

        await client.hSet('key', hash);

        const results: Record<string, string> = {};
        for await (const { field, value } of client.hScanIterator('key')) {
            results[field] = value;
        }

        assert.deepEqual(hash, results);
    });

    itWithClient(TestRedisServers.OPEN, 'sScanIterator', async client => {
        const members = new Set<string>();
        for (let i = 0; i < 100; i++) {
            members.add(i.toString());
        }

        await client.sAdd('key', Array.from(members));

        const results = new Set<string>();
        for await (const key of client.sScanIterator('key')) {
            results.add(key);
        }

        assert.deepEqual(members, results);
    });

    itWithClient(TestRedisServers.OPEN, 'zScanIterator', async client => {
        const members = [];
        for (let i = 0; i < 100; i++) {
            members.push({
                score: 1,
                value: i.toString()
            });
        }

        await client.zAdd('key', members);

        const map = new Map();
        for await (const member of client.zScanIterator('key')) {
            map.set(member.value, member.score);
        }

        type MemberTuple = [string, number];

        function sort(a: MemberTuple, b: MemberTuple) {
            return Number(b[0]) - Number(a[0]);
        }

        assert.deepEqual(
            [...map.entries()].sort(sort),
            members.map<MemberTuple>(member => [member.value, member.score]).sort(sort)
        );
    });

    itWithClient(TestRedisServers.OPEN, 'PubSub', async publisher => {
        const subscriber = publisher.duplicate();

        await subscriber.connect();

        try {
            const channelListener1 = spy(),
                channelListener2 = spy(),
                patternListener = spy();

            await Promise.all([
                subscriber.subscribe('channel', channelListener1),
                subscriber.subscribe('channel', channelListener2),
                subscriber.pSubscribe('channel*', patternListener)
            ]);

            await Promise.all([
                waitTillBeenCalled(channelListener1),
                waitTillBeenCalled(channelListener2),
                waitTillBeenCalled(patternListener),
                publisher.publish('channel', 'message')
            ]);

            assert.ok(channelListener1.calledOnceWithExactly('message', 'channel'));
            assert.ok(channelListener2.calledOnceWithExactly('message', 'channel'));
            assert.ok(patternListener.calledOnceWithExactly('message', 'channel'));

            await subscriber.unsubscribe('channel', channelListener1);
            await Promise.all([
                waitTillBeenCalled(channelListener2),
                waitTillBeenCalled(patternListener),
                publisher.publish('channel', 'message')
            ]);

            assert.ok(channelListener1.calledOnce);
            assert.ok(channelListener2.calledTwice);
            assert.ok(channelListener2.secondCall.calledWithExactly('message', 'channel'));
            assert.ok(patternListener.calledTwice);
            assert.ok(patternListener.secondCall.calledWithExactly('message', 'channel'));

            await subscriber.unsubscribe('channel');
            await Promise.all([
                waitTillBeenCalled(patternListener),
                publisher.publish('channel', 'message')
            ]);

            assert.ok(channelListener1.calledOnce);
            assert.ok(channelListener2.calledTwice);
            assert.ok(patternListener.calledThrice);
            assert.ok(patternListener.thirdCall.calledWithExactly('message', 'channel'));

            await subscriber.pUnsubscribe();
            await publisher.publish('channel', 'message');

            assert.ok(channelListener1.calledOnce);
            assert.ok(channelListener2.calledTwice);
            assert.ok(patternListener.calledThrice);
        } finally {
            await subscriber.disconnect();
        }
    });
});
