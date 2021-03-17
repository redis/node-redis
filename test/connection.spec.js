'use strict';

var assert = require('assert');
var config = require('./lib/config');
var helper = require('./helper');
var redis = config.redis;
var intercept = require('intercept-stdout');
var net = require('net');
var client;

describe('connection tests', function () {

    beforeEach(function () {
        client = null;
    });
    afterEach(function () {
        if (!client) return;

        client.end(true);
    });

    it('unofficially support for a private stream', function () {
        // While using a private stream, reconnection and other features are not going to work properly.
        // Besides that some functions also have to be monkey patched to be safe from errors in this case.
        // Therefore this is not officially supported!
        var socket = new net.Socket();
        client = new redis.RedisClient({
            prefix: 'test'
        }, socket);
        assert.strictEqual(client.stream, socket);
        assert.strictEqual(client.stream.listeners('error').length, 1);
        assert.strictEqual(client.address, '"Private stream"');
        // Pretent a reconnect event
        client.create_stream();
        assert.strictEqual(client.stream, socket);
        assert.strictEqual(client.stream.listeners('error').length, 1);
    });

    describe('quit on lost connections', function () {

        it('calling quit while the connection is down should not end in reconnecting version a', function (done) {
            var called = 0;
            client = redis.createClient({
                port: 9999,
                retry_strategy: function (options) {
                    var bool = client.quit(function (err, res) {
                        assert.strictEqual(res, 'OK');
                        assert.strictEqual(err, null);
                        assert.strictEqual(called++, -1);
                        setTimeout(done, 25);
                    });
                    assert.strictEqual(bool, false);
                    assert.strictEqual(called++, 0);
                    return 5;
                }
            });
            client.set('foo', 'bar', function (err, res) {
                assert.strictEqual(err.message, 'Stream connection ended and command aborted.');
                called = -1;
            });
        });

        it('calling quit while the connection is down should not end in reconnecting version b', function (done) {
            var called = false;
            client = redis.createClient(9999);
            client.set('foo', 'bar', function (err, res) {
                assert.strictEqual(err.message, 'Stream connection ended and command aborted.');
                called = true;
            });
            var bool = client.quit(function (err, res) {
                assert.strictEqual(res, 'OK');
                assert.strictEqual(err, null);
                assert(called);
                done();
            });
            assert.strictEqual(bool, false);
        });

        it('calling quit while the connection is down without offline queue should end the connection right away', function (done) {
            var called = false;
            client = redis.createClient(9999, {
                enable_offline_queue: false
            });
            client.set('foo', 'bar', function (err, res) {
                assert.strictEqual(err.message, 'SET can\'t be processed. The connection is not yet established and the offline queue is deactivated.');
                called = true;
            });
            var bool = client.quit(function (err, res) {
                assert.strictEqual(res, 'OK');
                assert.strictEqual(err, null);
                assert(called);
                done();
            });
            // TODO: In v.3 the quit command would be fired right away, so bool should be true
            assert.strictEqual(bool, false);
        });

        it('calling quit while connected without offline queue should end the connection when all commands have finished', function (done) {
            var called = false;
            client = redis.createClient({
                enable_offline_queue: false
            });
            client.on('ready', function () {
                client.set('foo', 'bar', function (err, res) {
                    assert.strictEqual(res, 'OK');
                    called = true;
                });
                var bool = client.quit(function (err, res) {
                    assert.strictEqual(res, 'OK');
                    assert.strictEqual(err, null);
                    assert(called);
                    done();
                });
                // TODO: In v.3 the quit command would be fired right away, so bool should be true
                assert.strictEqual(bool, true);
            });
        });

        it('do not quit before connected or a connection issue is detected', function (done) {
            client = redis.createClient();
            client.set('foo', 'bar', helper.isString('OK'));
            var bool = client.quit(done);
            assert.strictEqual(bool, false);
        });

        it('quit "succeeds" even if the client connection is closed while doing so', function (done) {
            client = redis.createClient();
            client.set('foo', 'bar', function (err, res) {
                assert.strictEqual(res, 'OK');
                client.quit(function (err, res) {
                    assert.strictEqual(res, 'OK');
                    done(err);
                });
                client.end(true); // Flushing the quit command should result in a success
            });
        });

        it('quit right away if connection drops while quit command is on the fly', function (done) {
            client = redis.createClient();
            client.once('ready', function () {
                client.set('foo', 'bar', helper.isError());
                var bool = client.quit(done);
                assert.strictEqual(bool, true);
                process.nextTick(function () {
                    client.stream.destroy();
                });
            });
        });

    });

    helper.allTests(function (ip, args) {

        describe('using ' + ip, function () {

            describe('on lost connection', function () {
                it('emit an error after max retry timeout and do not try to reconnect afterwards', function (done) {
                    // TODO: Investigate why this test fails with windows. Reconnect is only triggered once
                    if (process.platform === 'win32') this.skip();

                    var connect_timeout = 600; // in ms
                    client = redis.createClient({
                        connect_timeout: connect_timeout
                    });
                    var time = 0;

                    client.once('ready', function () {
                        helper.killConnection(client);
                    });

                    client.on('reconnecting', function (params) {
                        time += params.delay;
                    });

                    client.on('error', function (err) {
                        if (/Redis connection in broken state: connection timeout.*?exceeded./.test(err.message)) {
                            process.nextTick(function () { // End is called after the error got emitted
                                assert.strictEqual(client.emitted_end, true);
                                assert.strictEqual(client.connected, false);
                                assert.strictEqual(client.ready, false);
                                assert.strictEqual(client.closing, true);
                                assert.strictEqual(client.retry_totaltime, connect_timeout);
                                assert.strictEqual(time, connect_timeout);
                                done();
                            });
                        }
                    });
                });

                it('end connection while retry is still ongoing', function (done) {
                    var connect_timeout = 1000; // in ms
                    client = redis.createClient({
                        connect_timeout: connect_timeout
                    });

                    client.once('ready', function () {
                        helper.killConnection(client);
                    });

                    client.on('reconnecting', function (params) {
                        client.end(true);
                        assert.strictEqual(params.times_connected, 1);
                        setTimeout(done, 5);
                    });
                });

                it('can not connect with wrong host / port in the options object', function (done) {
                    var options = {
                        host: 'somewhere',
                        port: 6379,
                        family: ip,
                        max_attempts: 1
                    };
                    client = redis.createClient(options);
                    assert.strictEqual(client.connection_options.family, ip === 'IPv6' ? 6 : 4);
                    assert.strictEqual(Object.keys(options).length, 4);
                    var end = helper.callFuncAfter(done, 2);

                    client.on('error', function (err) {
                        assert(/CONNECTION_BROKEN|ENOTFOUND|EAI_AGAIN/.test(err.code));
                        end();
                    });

                });

                it('emits error once if reconnecting after command has been executed but not yet returned without callback', function (done) {
                    client = redis.createClient.apply(null, args);

                    client.on('ready', function () {
                        client.set('foo', 'bar', function (err) {
                            assert.strictEqual(err.code, 'UNCERTAIN_STATE');
                            done();
                        });
                        // Abort connection before the value returned
                        client.stream.destroy();
                    });
                });

                it('retryStrategy used to reconnect with individual error', function (done) {
                    client = redis.createClient({
                        retryStrategy: function (options) {
                            if (options.totalRetryTime > 150) {
                                client.set('foo', 'bar');
                                client.once('error', function (err) {
                                    assert.strictEqual(err.message, 'Redis connection in broken state: retry aborted.');
                                    assert.strictEqual(err.origin.message, 'Connection timeout');
                                    done();
                                });
                                // Pass a individual error message to the error handler
                                return new Error('Connection timeout');
                            }
                            return Math.min(options.attempt * 25, 200);
                        },
                        port: 9999
                    });
                });

                it('retry_strategy used to reconnect', function (done) {
                    client = redis.createClient({
                        retry_strategy: function (options) {
                            if (options.total_retry_time > 150) {
                                client.set('foo', 'bar');
                                client.once('error', function (err) {
                                    assert.strictEqual(err.message, 'Redis connection in broken state: retry aborted.');
                                    assert.strictEqual(err.code, 'CONNECTION_BROKEN');
                                    assert.strictEqual(err.origin.code, 'ECONNREFUSED');
                                    done();
                                });
                                return false;
                            }
                            return Math.min(options.attempt * 25, 200);
                        },
                        port: 9999
                    });
                });

                it('retryStrategy used to reconnect with defaults', function (done) {
                    var unhookIntercept = intercept(function () {
                        return '';
                    });
                    redis.debugMode = true;
                    client = redis.createClient({
                        retryStrategy: function (options) {
                            client.set('foo', 'bar');
                            assert(redis.debugMode);
                            return null;
                        }
                    });
                    setTimeout(function () {
                        client.stream.destroy();
                    }, 50);
                    client.on('error', function (err) {
                        if (err instanceof redis.AbortError) {
                            assert.strictEqual(err.message, 'Redis connection in broken state: retry aborted.');
                            assert.strictEqual(err.code, 'CONNECTION_BROKEN');
                            unhookIntercept();
                            redis.debugMode = false;
                            done();
                        }
                    });
                });
            });

            describe('when not connected', function () {

                it('emit an error after the socket timeout exceeded the connect_timeout time', function (done) {
                    var connect_timeout = 500; // in ms
                    client = redis.createClient({
                        // Auto detect ipv4 and use non routable ip to trigger the timeout
                        host: '10.255.255.1',
                        connect_timeout: connect_timeout
                    });
                    process.nextTick(function () {
                        assert.strictEqual(client.stream.listeners('timeout').length, 1);
                    });
                    assert.strictEqual(client.address, '10.255.255.1:6379');
                    assert.strictEqual(client.connection_options.family, 4);

                    client.on('reconnecting', function (params) {
                        throw new Error('No reconnect, since no connection was ever established');
                    });

                    var time = Date.now();
                    client.on('error', function (err) {
                        if (err.code === 'ENETUNREACH') { // The test is run without a internet connection. Pretent it works
                            return done();
                        }
                        assert(/Redis connection in broken state: connection timeout.*?exceeded./.test(err.message), err.message);
                        // The code execution on windows is very slow at times
                        var add = process.platform !== 'win32' ? 15 : 200;
                        var now = Date.now();
                        assert(now - time < connect_timeout + add, 'The real timeout time should be below ' + (connect_timeout + add) + 'ms but is: ' + (now - time));
                        // Timers sometimes trigger early (e.g. 1ms to early)
                        assert(now - time >= connect_timeout - 5, 'The real timeout time should be above ' + connect_timeout + 'ms, but it is: ' + (now - time));
                        done();
                    });
                });

                it('use the system socket timeout if the connect_timeout has not been provided', function (done) {
                    client = redis.createClient({
                        host: '0:0:0:0:0:0:0:1', // auto detect ip v6
                        no_ready_check: true
                    });
                    assert.strictEqual(client.address, '0:0:0:0:0:0:0:1:6379');
                    assert.strictEqual(client.connection_options.family, 6);
                    process.nextTick(function () {
                        assert.strictEqual(client.stream.listeners('timeout').length, 0);
                        done();
                    });
                });

                it('clears the socket timeout after a connection has been established', function (done) {
                    client = redis.createClient({
                        connect_timeout: 1000
                    });
                    process.nextTick(function () {
                        // node > 6
                        var timeout = client.stream.timeout;
                        // node <= 6
                        if (timeout === undefined) timeout = client.stream._idleTimeout;
                        assert.strictEqual(timeout, 1000);
                    });
                    client.on('connect', function () {
                        // node > 6
                        var expected = 0;
                        var timeout = client.stream.timeout;
                        // node <= 6
                        if (timeout === undefined) {
                            timeout = client.stream._idleTimeout;
                            expected = -1;
                        }
                        assert.strictEqual(timeout, expected);
                        assert.strictEqual(client.stream.listeners('timeout').length, 0);
                        client.on('ready', done);
                    });
                });

                it('connect with host and port provided in the options object', function (done) {
                    client = redis.createClient({
                        host: 'localhost',
                        port: '6379',
                        connect_timeout: 1000
                    });

                    client.once('ready', done);
                });

                it('connect with path provided in the options object', function (done) {
                    if (process.platform === 'win32') {
                        this.skip();
                    }
                    client = redis.createClient({
                        path: '/tmp/redis.sock',
                        connect_timeout: 1000
                    });

                    var end = helper.callFuncAfter(done, 2);

                    client.once('ready', end);
                    client.set('foo', 'bar', end);
                });

                it('connects correctly with args', function (done) {
                    client = redis.createClient.apply(null, args);
                    client.on('error', done);

                    client.once('ready', function () {
                        client.removeListener('error', done);
                        client.get('recon 1', done);
                    });
                });

                it('connects correctly with default values', function (done) {
                    client = redis.createClient();
                    client.on('error', done);

                    client.once('ready', function () {
                        client.removeListener('error', done);
                        client.get('recon 1', done);
                    });
                });

                it('connects with a port only', function (done) {
                    client = redis.createClient(6379);
                    assert.strictEqual(client.connection_options.family, 4);
                    client.on('error', done);

                    client.once('ready', function () {
                        client.removeListener('error', done);
                        client.get('recon 1', done);
                    });
                });

                it('connects correctly to localhost', function (done) {
                    client = redis.createClient(null, null);
                    client.on('error', done);

                    client.once('ready', function () {
                        client.removeListener('error', done);
                        client.get('recon 1', done);
                    });
                });

                it('connects correctly to the provided host with the port set to null', function (done) {
                    client = redis.createClient(null, 'localhost');
                    client.on('error', done);
                    assert.strictEqual(client.address, 'localhost:6379');

                    client.once('ready', function () {
                        client.set('foo', 'bar');
                        client.get('foo', function (err, res) {
                            assert.strictEqual(res, 'bar');
                            done(err);
                        });
                    });
                });

                it('connects correctly to localhost and no ready check', function (done) {
                    client = redis.createClient(undefined, undefined, {
                        no_ready_check: true
                    });
                    client.on('error', done);

                    client.once('ready', function () {
                        client.set('foo', 'bar');
                        client.get('foo', function (err, res) {
                            assert.strictEqual(res, 'bar');
                            done(err);
                        });
                    });
                });

                it('connects correctly to the provided host with the port set to undefined', function (done) {
                    client = redis.createClient(undefined, 'localhost', {
                        no_ready_check: true
                    });
                    client.on('error', done);
                    assert.strictEqual(client.address, 'localhost:6379');

                    client.once('ready', function () {
                        client.set('foo', 'bar');
                        client.get('foo', function (err, res) {
                            assert.strictEqual(res, 'bar');
                            done(err);
                        });
                    });
                });

                it('connects correctly even if the info command is not present on the redis server', function (done) {
                    client = redis.createClient.apply(null, args);
                    client.info = function (cb) {
                        // Mock the result
                        cb(new Error("ERR unknown command 'info'"));
                    };
                    client.once('ready', function () {
                        assert.strictEqual(Object.keys(client.server_info).length, 0);
                        done();
                    });
                });

                it('fake the stream to mock redis', function () {
                    // This is needed for libraries that want to mock the stream like fakeredis
                    var temp = redis.RedisClient.prototype.create_stream;
                    var create_stream_string = String(temp);
                    redis.RedisClient.prototype.create_stream = function () {
                        this.connected = true;
                        this.ready = true;
                    };
                    client = new redis.RedisClient();
                    assert.strictEqual(client.stream, undefined);
                    assert.strictEqual(client.ready, true);
                    assert.strictEqual(client.connected, true);
                    client.end = function () {};
                    assert(create_stream_string !== String(redis.RedisClient.prototype.create_stream));
                    redis.RedisClient.prototype.create_stream = temp;
                    assert(create_stream_string === String(redis.RedisClient.prototype.create_stream));
                });

                if (ip === 'IPv4') {
                    it('allows connecting with the redis url to the default host and port, select db 3 and warn about duplicate db option', function (done) {
                        client = redis.createClient('redis:///3?db=3');
                        assert.strictEqual(client.selected_db, '3');
                        client.on('ready', done);
                    });

                    it('allows connecting with the redis url and the default port and auth provided even though it is not required', function (done) {
                        client = redis.createClient('redis://:porkchopsandwiches@' + config.HOST[ip] + '/');
                        var end = helper.callFuncAfter(done, 2);
                        client.on('warning', function (msg) {
                            assert.strictEqual(msg, 'Warning: Redis server does not require a password, but a password was supplied.');
                            end();
                        });
                        client.on('ready', end);
                    });

                    it('allows connecting with the redis url as first parameter and the options as second parameter', function (done) {
                        client = redis.createClient('//127.0.0.1', {
                            connect_timeout: 1000
                        });
                        assert.strictEqual(client.options.connect_timeout, 1000);
                        client.on('ready', done);
                    });

                    it('allows connecting with the redis url in the options object and works with protocols other than the redis protocol (e.g. http)', function (done) {
                        client = redis.createClient({
                            url: 'http://:porkchopsandwiches@' + config.HOST[ip] + '/3'
                        });
                        assert.strictEqual(client.auth_pass, 'porkchopsandwiches');
                        assert.strictEqual(+client.selected_db, 3);
                        assert(!client.options.port);
                        assert.strictEqual(client.options.host, config.HOST[ip]);
                        client.on('ready', done);
                    });

                    it('allows connecting with the redis url and no auth and options as second parameter', function (done) {
                        var options = {
                            detect_buffers: false
                        };
                        client = redis.createClient('redis://' + config.HOST[ip] + ':' + config.PORT, options);
                        assert.strictEqual(Object.keys(options).length, 1);
                        client.on('ready', done);
                    });

                    it('allows connecting with the redis url and no auth and options as third parameter', function (done) {
                        client = redis.createClient('redis://' + config.HOST[ip] + ':' + config.PORT, null, {
                            detect_buffers: false
                        });
                        client.on('ready', done);
                    });
                }

                it('redis still loading <= 500', function (done) {
                    client = redis.createClient.apply(null, args);
                    var tmp = client.info.bind(client);
                    var end = helper.callFuncAfter(done, 3);
                    var delayed = false;
                    var time;
                    // Mock original function and pretent redis is still loading
                    client.info = function (cb) {
                        tmp(function (err, res) {
                            if (!delayed) {
                                assert(!err);
                                client.server_info.loading = 1;
                                client.server_info.loading_eta_seconds = 0.5;
                                delayed = true;
                                time = Date.now();
                            }
                            end();
                            cb(err, res);
                        });
                    };
                    client.on('ready', function () {
                        var rest = Date.now() - time;
                        assert(rest >= 495, 'Rest should be equal or above 500 ms but is: ' + rest); // setTimeout might trigger early
                        // Be on the safe side and accept 200ms above the original value
                        assert(rest - 250 < 500, 'Rest - 250 should be below 500 ms but is: ' + (rest - 250));
                        assert(delayed);
                        end();
                    });
                });

                it('redis still loading > 1000ms', function (done) {
                    client = redis.createClient.apply(null, args);
                    var tmp = client.info.bind(client);
                    var end = helper.callFuncAfter(done, 3);
                    var delayed = false;
                    var time;
                    // Mock original function and pretent redis is still loading
                    client.info = function (cb) {
                        tmp(function (err, res) {
                            if (!delayed) {
                                assert(!err);
                                // Try reconnecting after one second even if redis tells us the time needed is above one second
                                client.server_info.loading = 1;
                                client.server_info.loading_eta_seconds = 2.5;
                                delayed = true;
                                time = Date.now();
                            }
                            end();
                            cb(err, res);
                        });
                    };
                    client.on('ready', function () {
                        var rest = Date.now() - time;
                        assert(rest >= 998, '`rest` should be equal or above 1000 ms but is: ' + rest); // setTimeout might trigger early
                        // Be on the safe side and accept 200ms above the original value
                        assert(rest - 250 < 1000, '`rest` - 250 should be below 1000 ms but is: ' + (rest - 250));
                        assert(delayed);
                        end();
                    });
                });

            });

        });
    });
});
