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
                client.end();
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
                        client.end();
                        setTimeout(done, 100);
                    });
                });

                it("can not connect with wrong host / port in the options object", function (done) {
                    var options = {
                        host: 'somewhere',
                        port: 6379,
                        max_attempts: 1
                    };
                    client = redis.createClient(options);
                    assert.strictEqual(Object.keys(options).length, 3);
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
            });

            describe("when not connected", function () {

                it("emit an error after the socket timeout exceeded the connect_timeout time", function (done) {
                    var connect_timeout = 1000; // in ms
                    client = redis.createClient({
                        parser: parser,
                        host: '192.168.74.167',
                        connect_timeout: connect_timeout
                    });
                    process.nextTick(function() {
                        assert(client.stream._events.timeout);
                    });
                    assert.strictEqual(client.address, '192.168.74.167:6379');
                    var time = Date.now();

                    client.on("reconnecting", function (params) {
                        throw new Error('No reconnect, since no connection was ever established');
                    });

                    client.on('error', function(err) {
                        assert(/Redis connection in broken state: connection timeout.*?exceeded./.test(err.message));
                        assert(Date.now() - time < connect_timeout + 50);
                        done();
                    });
                });

                it("use the system socket timeout if the connect_timeout has not been provided", function () {
                    client = redis.createClient({
                        parser: parser,
                        host: '192.168.74.167'
                    });
                    process.nextTick(function() {
                        assert.strictEqual(client.stream._events.timeout, undefined);
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
                        assert.strictEqual(client.stream._events.timeout, undefined);
                        done();
                    });
                });

                it("connect with host and port provided in the options object", function (done) {
                    client = redis.createClient({
                        host: 'localhost',
                        port: '6379',
                        parser: parser,
                        connect_timeout: 1000
                    });

                    client.once('ready', function() {
                        done();
                    });
                });

                if (process.platform !== 'win32') {
                    it("connect with path provided in the options object", function (done) {
                        client = redis.createClient({
                            path: '/tmp/redis.sock',
                            parser: parser,
                            connect_timeout: 1000
                        });

                        var end = helper.callFuncAfter(done, 2);

                        client.once('ready', function() {
                            end();
                        });

                        client.set('foo', 'bar', end);
                    });
                }

                it("connects correctly with args", function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.on("error", done);

                    client.once("ready", function () {
                        client.removeListener("error", done);
                        client.get("recon 1", function (err, res) {
                            done(err);
                        });
                    });
                });

                it("connects correctly with default values", function (done) {
                    client = redis.createClient();
                    client.on("error", done);

                    client.once("ready", function () {
                        client.removeListener("error", done);
                        client.get("recon 1", function (err, res) {
                            done(err);
                        });
                    });
                });

                it("connects with a port only", function (done) {
                    client = redis.createClient(6379);
                    client.on("error", done);

                    client.once("ready", function () {
                        client.removeListener("error", done);
                        client.get("recon 1", function (err, res) {
                            done(err);
                        });
                    });
                });

                it("connects correctly to localhost", function (done) {
                    client = redis.createClient(null, null);
                    client.on("error", done);

                    client.once("ready", function () {
                        client.removeListener("error", done);
                        client.get("recon 1", function (err, res) {
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

                it("works with missing options object for new redis instances", function () {
                    // This is needed for libraries that have their own createClient function like fakeredis
                    client = new redis.RedisClient({ on: function () {}});
                });

                it("throws on strange connection info", function () {
                    client = {
                        end: function() {}
                    };
                    try {
                        redis.createClient(true);
                        throw new Error('failed');
                    } catch (err) {
                        assert.equal(err.message, 'Unknown type of connection in createClient()');
                    }
                });

                if (ip === 'IPv4') {
                    it('allows connecting with the redis url and the default port', function (done) {
                        client = redis.createClient('redis://foo:porkchopsandwiches@' + config.HOST[ip]);
                        client.on("ready", function () {
                            return done();
                        });
                    });

                    it('allows connecting with the redis url and no auth and options as second parameter', function (done) {
                        var options = {
                            detect_buffers: false
                        };
                        client = redis.createClient('redis://' + config.HOST[ip] + ':' + config.PORT, options);
                        assert.strictEqual(Object.keys(options).length, 1);
                        client.on("ready", function () {
                            return done();
                        });
                    });

                    it('allows connecting with the redis url and no auth and options as third parameter', function (done) {
                        client = redis.createClient('redis://' + config.HOST[ip] + ':' + config.PORT, null, {
                            detect_buffers: false
                        });
                        client.on("ready", function () {
                            return done();
                        });
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
                                res = res.toString().replace(/loading:0/, 'loading:1\r\nloading_eta_seconds:0.5');
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
                                res = res.toString().replace(/loading:0/, 'loading:1\r\nloading_eta_seconds:2.5');
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
