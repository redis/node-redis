'use strict';

var assert = require("assert");
var config = require("./lib/config");
var helper = require('./helper');
var redis = config.redis;

describe("connection tests", function () {
    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {

            var client;

            beforeEach(function () {
                client = null;
            });
            afterEach(function () {
                client.end(true);
            });

            describe("on lost connection", function () {
                it("emit an error after max retry attempts and do not try to reconnect afterwards", function (done) {
                    var max_attempts = 4;
                    var options = {
                        parser: parser,
                        max_attempts: max_attempts
                    };
                    client = redis.createClient(options);
                    assert.strictEqual(Object.keys(options).length, 2);
                    var calls = 0;

                    client.once('ready', function() {
                        helper.killConnection(client);
                    });

                    client.on("reconnecting", function (params) {
                        calls++;
                    });

                    client.on('error', function(err) {
                        if (/Redis connection in broken state: maximum connection attempts.*?exceeded./.test(err.message)) {
                            setTimeout(function () {
                                assert.strictEqual(calls, max_attempts - 1);
                                done();
                            }, 500);
                        }
                    });
                });

                it("emit an error after max retry timeout and do not try to reconnect afterwards", function (done) {
                    // TODO: Investigate why this test fails with windows. Reconnect is only triggered once
                    if (process.platform === 'win32') this.skip();

                    var connect_timeout = 600; // in ms
                    client = redis.createClient({
                        parser: parser,
                        connect_timeout: connect_timeout
                    });
                    var time = 0;

                    client.once('ready', function() {
                        helper.killConnection(client);
                    });

                    client.on("reconnecting", function (params) {
                        time += params.delay;
                    });

                    client.on('error', function(err) {
                        if (/Redis connection in broken state: connection timeout.*?exceeded./.test(err.message)) {
                            setTimeout(function () {
                                assert.strictEqual(client.retry_totaltime, connect_timeout);
                                assert.strictEqual(time, connect_timeout);
                                done();
                            }, 500);
                        }
                    });
                });

                it("end connection while retry is still ongoing", function (done) {
                    var connect_timeout = 1000; // in ms
                    client = redis.createClient({
                        parser: parser,
                        connect_timeout: connect_timeout
                    });

                    client.once('ready', function() {
                        helper.killConnection(client);
                    });

                    client.on("reconnecting", function (params) {
                        client.end(true);
                        setTimeout(done, 100);
                    });
                });

                it("can not connect with wrong host / port in the options object", function (done) {
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

                it("emits error once if reconnecting after command has been executed but not yet returned without callback", function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.on('error', function(err) {
                        assert.strictEqual(err.code, 'UNCERTAIN_STATE');
                        done();
                    });

                    client.on('ready', function() {
                        client.set("foo", 'bar');
                        // Abort connection before the value returned
                        client.stream.destroy();
                    });
                });

                it("retry_strategy used to reconnect with individual error", function (done) {
                    var text = '';
                    var unhookIntercept = intercept(function (data) {
                        text += data;
                        return '';
                    });
                    var end = helper.callFuncAfter(done, 2);
                    client = redis.createClient({
                        retry_strategy: function (options) {
                            if (options.total_retry_time > 150) {
                                client.set('foo', 'bar', function (err, res) {
                                    assert.strictEqual(err.message, 'Connection timeout');
                                    end();
                                });
                                // Pass a individual error message to the error handler
                                return new Error('Connection timeout');
                            }
                            return Math.min(options.attempt * 25, 200);
                        },
                        max_attempts: 5,
                        retry_max_delay: 123,
                        port: 9999
                    });

                    client.on('error', function(err) {
                        unhookIntercept();
                        assert.strictEqual(
                            text,
                            'node_redis: WARNING: You activated the retry_strategy and max_attempts at the same time. This is not possible and max_attempts will be ignored.\n' +
                            'node_redis: WARNING: You activated the retry_strategy and retry_max_delay at the same time. This is not possible and retry_max_delay will be ignored.\n'
                        );
                        assert.strictEqual(err.message, 'Connection timeout');
                        assert(!err.code);
                        end();
                    });
                });

                it("retry_strategy used to reconnect", function (done) {
                    var end = helper.callFuncAfter(done, 2);
                    client = redis.createClient({
                        retry_strategy: function (options) {
                            if (options.total_retry_time > 150) {
                                client.set('foo', 'bar', function (err, res) {
                                    assert.strictEqual(err.code, 'ECONNREFUSED');
                                    end();
                                });
                                return false;
                            }
                            return Math.min(options.attempt * 25, 200);
                        },
                        port: 9999
                    });

                    client.on('error', function(err) {
                        assert.strictEqual(err.code, 'ECONNREFUSED');
                        end();
                    });
                });
            });

            describe("when not connected", function () {

                it("emit an error after the socket timeout exceeded the connect_timeout time", function (done) {
                    var connect_timeout = 1000; // in ms
                    var time = Date.now();
                    client = redis.createClient({
                        parser: parser,
                        // Auto detect ipv4 and use non routable ip to trigger the timeout
                        host: '10.255.255.1',
                        connect_timeout: connect_timeout
                    });
                    process.nextTick(function() {
                        assert.strictEqual(client.stream.listeners('timeout').length, 1);
                    });
                    assert.strictEqual(client.address, '10.255.255.1:6379');
                    assert.strictEqual(client.connection_options.family, 4);

                    client.on("reconnecting", function (params) {
                        throw new Error('No reconnect, since no connection was ever established');
                    });

                    client.on('error', function(err) {
                        assert(/Redis connection in broken state: connection timeout.*?exceeded./.test(err.message));
                        assert(Date.now() - time < connect_timeout + 25);
                        assert(Date.now() - time >= connect_timeout - 3); // Timers sometimes trigger early (e.g. 1ms to early)
                        done();
                    });
                });

                it("use the system socket timeout if the connect_timeout has not been provided", function () {
                    client = redis.createClient({
                        parser: parser,
                        host: '2001:db8::ff00:42:8329' // auto detect ip v6
                    });
                    assert.strictEqual(client.address, '2001:db8::ff00:42:8329:6379');
                    assert.strictEqual(client.connection_options.family, 6);
                    process.nextTick(function() {
                        assert.strictEqual(client.stream.listeners('timeout').length, 0);
                    });
                });

                it("clears the socket timeout after a connection has been established", function (done) {
                    client = redis.createClient({
                        parser: parser,
                        connect_timeout: 1000
                    });
                    process.nextTick(function() {
                        assert.strictEqual(client.stream._idleTimeout, 1000);
                    });
                    client.on('connect', function () {
                        assert.strictEqual(client.stream._idleTimeout, -1);
                        assert.strictEqual(client.stream.listeners('timeout').length, 0);
                        client.on('ready', done);
                    });
                });

                it("connect with host and port provided in the options object", function (done) {
                    client = redis.createClient({
                        host: 'localhost',
                        port: '6379',
                        parser: parser,
                        connect_timeout: 1000
                    });

                    client.once('ready', done);
                });

                if (process.platform !== 'win32') {
                    it("connect with path provided in the options object", function (done) {
                        client = redis.createClient({
                            path: '/tmp/redis.sock',
                            parser: parser,
                            connect_timeout: 1000
                        });

                        var end = helper.callFuncAfter(done, 2);

                        client.once('ready', end);
                        client.set('foo', 'bar', end);
                    });
                }

                it("connects correctly with args", function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.on("error", done);

                    client.once("ready", function () {
                        client.removeListener("error", done);
                        client.get("recon 1", done);
                    });
                });

                it("connects correctly with default values", function (done) {
                    client = redis.createClient();
                    client.on("error", done);

                    client.once("ready", function () {
                        client.removeListener("error", done);
                        client.get("recon 1", done);
                    });
                });

                it("connects with a port only", function (done) {
                    client = redis.createClient(6379);
                    assert.strictEqual(client.connection_options.family, 4);
                    client.on("error", done);

                    client.once("ready", function () {
                        client.removeListener("error", done);
                        client.get("recon 1", done);
                    });
                });

                it("connects correctly to localhost", function (done) {
                    client = redis.createClient(null, null);
                    client.on("error", done);

                    client.once("ready", function () {
                        client.removeListener("error", done);
                        client.get("recon 1", done);
                    });
                });

                it("connects correctly to the provided host with the port set to null", function (done) {
                    client = redis.createClient(null, 'localhost');
                    client.on("error", done);
                    assert.strictEqual(client.address, 'localhost:6379');

                    client.once("ready", function () {
                        client.set('foo', 'bar');
                        client.get('foo', function(err, res) {
                            assert.strictEqual(res, 'bar');
                            done(err);
                        });
                    });
                });

                it("connects correctly to localhost and no ready check", function (done) {
                    client = redis.createClient(undefined, undefined, {
                        no_ready_check: true
                    });
                    client.on("error", done);

                    client.once("ready", function () {
                        client.set('foo', 'bar');
                        client.get('foo', function(err, res) {
                            assert.strictEqual(res, 'bar');
                            done(err);
                        });
                    });
                });

                it("connects correctly to the provided host with the port set to undefined", function (done) {
                    client = redis.createClient(undefined, 'localhost', {
                        no_ready_check: true
                    });
                    client.on("error", done);
                    assert.strictEqual(client.address, 'localhost:6379');

                    client.once("ready", function () {
                        client.set('foo', 'bar');
                        client.get('foo', function(err, res) {
                            assert.strictEqual(res, 'bar');
                            done(err);
                        });
                    });
                });

                it("connects correctly even if the info command is not present on the redis server", function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.info = function (cb) {
                        // Mock the result
                        cb(new Error("ERR unknown command 'info'"));
                    };
                    client.once("ready", function () {
                        assert.strictEqual(Object.keys(client.server_info).length, 0);
                        done();
                    });
                });

                it("fake the stream to mock redis", function () {
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
                        client.on("ready", done);
                    });

                    it('allows connecting with the redis url and the default port and auth provided even though it is not required', function (done) {
                        client = redis.createClient('redis://:porkchopsandwiches@' + config.HOST[ip] + '/');
                        var end = helper.callFuncAfter(done, 2);
                        client.on('warning', function (msg) {
                            assert.strictEqual(msg, 'Warning: Redis server does not require a password, but a password was supplied.');
                            end();
                        });
                        client.on("ready", end);
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
                            url: 'http://foo:porkchopsandwiches@' + config.HOST[ip] + '/3'
                        });
                        assert.strictEqual(client.auth_pass, 'porkchopsandwiches');
                        assert.strictEqual(+client.selected_db, 3);
                        assert(!client.options.port);
                        assert.strictEqual(client.options.host, config.HOST[ip]);
                        client.on("ready", done);
                    });

                    it('allows connecting with the redis url and no auth and options as second parameter', function (done) {
                        var options = {
                            detect_buffers: false
                        };
                        client = redis.createClient('redis://' + config.HOST[ip] + ':' + config.PORT, options);
                        assert.strictEqual(Object.keys(options).length, 1);
                        client.on("ready", done);
                    });

                    it('allows connecting with the redis url and no auth and options as third parameter', function (done) {
                        client = redis.createClient('redis://' + config.HOST[ip] + ':' + config.PORT, null, {
                            detect_buffers: false
                        });
                        client.on("ready", done);
                    });
                }

                it("redis still loading <= 1000ms", function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    var tmp = client.info.bind(client);
                    var end = helper.callFuncAfter(done, 3);
                    var delayed = false;
                    var time;
                    // Mock original function and pretent redis is still loading
                    client.info = function (cb) {
                        tmp(function(err, res) {
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
                    client.on("ready", function () {
                        var rest = Date.now() - time;
                        assert(rest >= 500);
                        // Be on the safe side and accept 200ms above the original value
                        assert(rest - 200 < 500);
                        assert(delayed);
                        end();
                    });
                });

                it("redis still loading > 1000ms", function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    var tmp = client.info.bind(client);
                    var end = helper.callFuncAfter(done, 3);
                    var delayed = false;
                    var time;
                    // Mock original function and pretent redis is still loading
                    client.info = function (cb) {
                        tmp(function(err, res) {
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
                    client.on("ready", function () {
                        var rest = Date.now() - time;
                        assert(rest >= 1000);
                        // Be on the safe side and accept 200ms above the original value
                        assert(rest - 200 < 1000);
                        assert(delayed);
                        end();
                    });
                });

            });

        });
    });
});
