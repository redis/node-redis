import { strict as assert, AssertionError } from 'assert';
import { once } from 'events';
import { itWithClient, TEST_REDIS_SERVERS, TestRedisServers, waitTillBeenCalled, isRedisVersionGreaterThan } from './test-utils';
import RedisClient from './client';
import { AbortError, ClientClosedError, ConnectionTimeoutError, WatchError } from './errors';
import { defineScript } from './lua-script';
import { spy } from 'sinon';

export const SQUARE_SCRIPT = defineScript({
    NUMBER_OF_KEYS: 0,
    SCRIPT: 'return ARGV[1] * ARGV[1];',
    transformArguments(number: number): Array<string> {
        return [number.toString()];
    },
    transformReply(reply: number): number {
        return reply;
    }
});

describe('Client', () => {
    describe('parseURL', () => {
        it('redis://user:secret@localhost:6379/0', () => {
            assert.deepEqual(
                RedisClient.parseURL('redis://user:secret@localhost:6379/0'),
                {
                    socket: {
                        host: 'localhost',
                        port: 6379
                    },
                    username: 'user',
                    password: 'secret',
                    database: 0
                }
            );
        });

        it('rediss://user:secret@localhost:6379/0', () => {
            assert.deepEqual(
                RedisClient.parseURL('rediss://user:secret@localhost:6379/0'),
                {
                    socket: {
                        host: 'localhost',
                        port: 6379,
                        tls: true
                    },
                    username: 'user',
                    password: 'secret',
                    database: 0
                }
            );
        });

        it('Invalid protocol', () => {
            assert.throws(
                () => RedisClient.parseURL('redi://user:secret@localhost:6379/0'),
                TypeError
            );
        });

        it('Invalid pathname', () => {
            assert.throws(
                () => RedisClient.parseURL('redis://user:secret@localhost:6379/NaN'),
                TypeError
            );
        });
    });

    describe('authentication', () => {
        itWithClient(TestRedisServers.PASSWORD, 'Client should be authenticated', async client => {
            assert.equal(
                await client.ping(),
                'PONG'
            );
        });

        it('should not retry connecting if failed due to wrong auth', async () => {
            const client = RedisClient.create({
                ...TEST_REDIS_SERVERS[TestRedisServers.PASSWORD],
                password: 'wrongpassword'
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
        const client = RedisClient.create({
            ...TEST_REDIS_SERVERS[TestRedisServers.OPEN],
            scripts: {
                square: SQUARE_SCRIPT
            },
            legacyMode: true
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

        it('client.{script} should return a promise', async () => {
            assert.equal(await client.square(2), 4);
        });
    });

    describe('events', () => {
        it('connect, ready, end', async () => {
            const client = RedisClient.create(TEST_REDIS_SERVERS[TestRedisServers.OPEN]);

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

        itWithClient(TestRedisServers.OPEN, 'bufferMode', async client => {
            assert.deepEqual(
                await client.sendCommand(['PING'], undefined, true),
                Buffer.from('PONG')
            );
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

            itWithClient(TestRedisServers.OPEN, 'AbortError', client => {
                const controller = new AbortController();
                controller.abort();

                return assert.rejects(
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

        itWithClient(TestRedisServers.OPEN, 'should reject the whole chain on error', client => {
            client.on('error', () => {
                // ignore errors
            });

            return assert.rejects(
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
                    square: SQUARE_SCRIPT
                }
            });

            await client.connect();

            try {
                assert.deepEqual(
                    await client.multi()
                        .square(2)
                        .exec(),
                    [4]
                );
            } finally {
                await client.disconnect();
            }
        });

        itWithClient(TestRedisServers.OPEN, 'WatchError', async client => {
            await client.watch('key');

            await client.set(
                RedisClient.commandOptions({
                    isolated: true
                }),
                'key',
                '1'
            );

            await assert.rejects(
                client.multi()
                    .decr('key')
                    .exec(),
                WatchError
            );
        });
    });

    it('scripts', async () => {
        const client = RedisClient.create({
            scripts: {
                square: SQUARE_SCRIPT
            }
        });

        await client.connect();

        try {
            assert.equal(
                await client.square(2),
                4
            );
        } finally {
            await client.disconnect();
        }
    });

    it('modules', async () => {
        const client = RedisClient.create({
            modules: {
                module: {
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

        await client.connect();

        try {
            assert.equal(
                await client.module.echo('message'),
                'message'
            );
        } finally {
            await client.disconnect();
        }
    });

    itWithClient(TestRedisServers.OPEN, 'executeIsolated', async client => {
        await client.sendCommand(['CLIENT', 'SETNAME', 'client']);

        assert.equal(
            await client.executeIsolated(isolatedClient =>
                isolatedClient.sendCommand(['CLIENT', 'GETNAME'])
            ),
            null
        );
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

            // should be able to send commands when unsubsribed from all channels (see #1652)
            await assert.doesNotReject(subscriber.ping());
        } finally {
            await subscriber.disconnect();
        }
    });

    it('ConnectionTimeoutError', async () => {
        const client = RedisClient.create({
            socket: {
                ...TEST_REDIS_SERVERS[TestRedisServers.OPEN],
                connectTimeout: 1
            }
        });

        try {
            const promise = assert.rejects(client.connect(), ConnectionTimeoutError),
                start = process.hrtime.bigint();

            // block the event loop for 1ms, to make sure the connection will timeout
            while (process.hrtime.bigint() - start < 1_000_000) {}

            await promise;
        } catch (err) {
            if (err instanceof AssertionError) {
                await client.disconnect();
            }

            throw err;
        }
    });

    it('client.quit', async () => {
        const client = RedisClient.create(TEST_REDIS_SERVERS[TestRedisServers.OPEN]);

        await client.connect();

        try {
            const quitPromise = client.quit();
            assert.equal(client.isOpen, false);
            await Promise.all([
                quitPromise,
                assert.rejects(client.ping(), ClientClosedError)
            ]);
        } finally {
            if (client.isOpen) {
                await client.disconnect();
            }
        }
    });
});
