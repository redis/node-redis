'use strict';

var assert = require("assert");
var config = require("./lib/config");
var helper = require('./helper');
var redis = config.redis;

describe("connection tests", function () {
    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {

            var client;

            afterEach(function () {
                if (client) {
                    client.end();
                }
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
                    var connect_timeout = 500; // in ms
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
                                assert(time === connect_timeout);
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
            });

            describe("when not connected", function () {

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

                    it("buffer commands and flush them after ", function (done) {
                        client = redis.createClient(9999, null, {
                            parser: parser
                        });

                        client.on('error', function(e) {
                            // ignore, b/c expecting a "can't connect" error
                        });

                        return setTimeout(function() {
                            client.set('foo', 'bar', function(err, result) {
                                // This should never be called
                                return done(err);
                            });

                            return setTimeout(function() {
                                assert.strictEqual(client.offline_queue.length, 1);
                                return done();
                            }, 25);
                        }, 50);
                    });

                it("throws on strange connection info", function () {
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

            });

        });
    });
});
