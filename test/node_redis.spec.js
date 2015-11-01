'use strict';

var assert = require("assert");
var config = require("./lib/config");
var helper = require('./helper');
var fork = require("child_process").fork;
var redis = config.redis;

describe("The node_redis client", function () {

    describe("testing parser existence", function () {
        it('throws on non-existence', function (done) {
            var mochaListener = helper.removeMochaListener();

            process.once('uncaughtException', function (err) {
                process.on('uncaughtException', mochaListener);
                assert.equal(err.message, 'Couldn\'t find named parser nonExistingParser on this system');
                return done();
            });

            redis.createClient({
                parser: 'nonExistingParser'
            });
        });
    });

    helper.allTests({
        allConnections: true
    }, function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            afterEach(function () {
                client.end();
            });

            describe("when connected", function () {
                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("connect", function () {
                        client.flushdb(done);
                    });
                });

                describe('big data', function () {

                    // Check if the fast mode for big strings is working correct
                    it('safe strings that are bigger than 30000 characters', function(done) {
                        var str = 'foo ಠ_ಠ bar ';
                        while (str.length < 111111) {
                            str += str;
                        }
                        client.set('foo', str);
                        client.get('foo', function (err, res) {
                            assert.strictEqual(res, str);
                            done();
                        });
                    });
                });

                describe("send_command", function () {

                    it("omitting args should be fine in some cases", function (done) {
                        client.send_command("info", undefined, function(err, res) {
                            assert(/redis_version/.test(res));
                            done();
                        });
                    });

                    it("using another type as cb should just work as if there were no callback parameter", function (done) {
                        client.send_command('set', ['test', 'bla'], [true]);
                        client.get('test', function(err, res) {
                            assert.equal(res, 'bla');
                            done();
                        });
                    });

                    it("misusing the function should eventually throw (no command)", function (done) {
                        client.send_command(true, 'info', function (err, res) {
                            assert(/ERR Protocol error/.test(err.message));
                            assert.equal(err.command, true);
                            assert.equal(err.code, 'ERR');
                            done();
                        });
                    });

                    it("misusing the function should eventually throw (wrong args)", function (done) {
                        client.send_command('info', false, function(err, res) {
                            assert.equal(err.message, 'ERR Protocol error: invalid multibulk length');
                            done();
                        });
                    });

                });

                describe(".end", function () {

                    it('used without flush', function(done) {
                        var end = helper.callFuncAfter(function() {
                            done(new Error('failed'));
                        }, 20);
                        var cb = function(err, res) {
                            assert.equal(err.message, "SET can't be processed. The connection has already been closed.");
                            end();
                        };
                        for (var i = 0; i < 20; i++) {
                            if (i === 10) {
                                client.end();
                            }
                            client.set('foo', 'bar', cb);
                        }
                        setTimeout(done, 250);
                    });

                    it('used with flush set to true', function(done) {
                        var end = helper.callFuncAfter(function() {
                            done();
                        }, 20);
                        var cb = function(err, res) {
                            assert(/The connection has already been closed./.test(err.message));
                            end();
                        };
                        for (var i = 0; i < 20; i++) {
                            if (i === 10) {
                                client.end(true);
                            }
                            client.set('foo', 'bar', cb);
                        }
                    });

                });

                describe("commands after using .quit should fail", function () {

                    it("return an error in the callback", function (done) {
                        if (helper.redisProcess().spawnFailed()) this.skip();

                        // TODO: Investigate why this test is failing hard and killing mocha if the client is created with .apply
                        // Seems like something is wrong while passing a socket connection to create client! args[1]
                        client = redis.createClient();
                        client.quit(function() {
                            client.get("foo", function(err, res) {
                                assert(err.message.indexOf('Redis connection gone') !== -1);
                                assert.strictEqual(client.offline_queue.length, 0);
                                done();
                            });
                        });
                    });

                    it("return an error in the callback version two", function (done) {
                        if (helper.redisProcess().spawnFailed()) this.skip();

                        client.quit();
                        setTimeout(function() {
                            client.get("foo", function(err, res) {
                                assert.strictEqual(err.message, 'GET can\'t be processed. The connection has already been closed.');
                                assert.strictEqual(err.command, 'GET');
                                assert.strictEqual(client.offline_queue.length, 0);
                                done();
                            });
                        }, 100);
                    });

                    it("emit an error", function (done) {
                        if (helper.redisProcess().spawnFailed()) this.skip();

                        client.quit();
                        client.on('error', function(err) {
                            assert.strictEqual(err.message, 'SET can\'t be processed. The connection has already been closed.');
                            assert.strictEqual(err.command, 'SET');
                            assert.strictEqual(client.offline_queue.length, 0);
                            done();
                        });
                        setTimeout(function() {
                            client.set('foo', 'bar');
                        }, 50);
                    });

                });

                describe("when redis closes unexpectedly", function () {
                    it("reconnects and can retrieve the pre-existing data", function (done) {
                        client.on("reconnecting", function on_recon(params) {
                            client.on("connect", function on_connect() {
                                var end = helper.callFuncAfter(function () {
                                    client.removeListener("connect", on_connect);
                                    client.removeListener("reconnecting", on_recon);
                                    assert.strictEqual(client.server_info.db0.keys, 2);
                                    assert.strictEqual(Object.keys(client.server_info.db0).length, 3);
                                    done();
                                }, 4);
                                client.get("recon 1", helper.isString("one", end));
                                client.get("recon 1", helper.isString("one", end));
                                client.get("recon 2", helper.isString("two", end));
                                client.get("recon 2", helper.isString("two", end));
                            });
                        });

                        client.set("recon 1", "one");
                        client.set("recon 2", "two", function (err, res) {
                            // Do not do this in normal programs. This is to simulate the server closing on us.
                            // For orderly shutdown in normal programs, do client.quit()
                            client.stream.destroy();
                        });
                    });

                    it("reconnects properly when monitoring", function (done) {
                        client.on("reconnecting", function on_recon(params) {
                            client.on("ready", function on_ready() {
                                assert.strictEqual(client.monitoring, true, "monitoring after reconnect");
                                client.removeListener("ready", on_ready);
                                client.removeListener("reconnecting", on_recon);
                                done();
                            });
                        });

                        assert.strictEqual(client.monitoring, false, "monitoring off at start");
                        client.set("recon 1", "one");
                        client.monitor(function (err, res) {
                            assert.strictEqual(client.monitoring, true, "monitoring on after monitor()");
                            client.set("recon 2", "two", function (err, res) {
                                // Do not do this in normal programs. This is to simulate the server closing on us.
                                // For orderly shutdown in normal programs, do client.quit()
                                client.stream.destroy();
                            });
                        });
                    });

                    // TODO: we should only have a single subscription in this this
                    // test but unsubscribing from the single channel indicates
                    // that one subscriber still exists, let's dig into this.
                    describe("and it's subscribed to a channel", function () {
                        // reconnect_select_db_after_pubsub
                        // Does not pass.
                        // "Connection in subscriber mode, only subscriber commands may be used"
                        it("reconnects, unsubscribes, and can retrieve the pre-existing data", function (done) {
                            client.on("ready", function on_connect() {
                                client.unsubscribe(helper.isNotError());

                                client.on('unsubscribe', function (channel, count) {
                                    // we should now be out of subscriber mode.
                                    client.set('foo', 'bar', helper.isString('OK', done));
                                });
                            });

                            client.set("recon 1", "one");
                            client.subscribe("recon channel", function (err, res) {
                                // Do not do this in normal programs. This is to simulate the server closing on us.
                                // For orderly shutdown in normal programs, do client.quit()
                                client.stream.destroy();
                            });
                        });
                    });

                    describe('domain', function () {
                        it('allows client to be executed from within domain', function (done) {
                            var domain;

                            try {
                                domain = require('domain').create();
                            } catch (err) {
                                console.log("Skipping test because this version of node doesn't have domains.");
                                return done();
                            }

                            domain.run(function () {
                                client.set('domain', 'value', function (err, res) {
                                    assert.ok(process.domain);
                                    throw new Error('ohhhh noooo');
                                });
                            });

                            // this is the expected and desired behavior
                            domain.on('error', function (err) {
                                assert.strictEqual(err.message, 'ohhhh noooo');
                                domain.exit();
                                return done();
                            });
                        });
                    });
                });

                describe('monitor', function () {
                    it('monitors commands on all other redis clients', function (done) {
                        helper.serverVersionAtLeast.call(this, client, [2, 6, 0]);

                        var monitorClient = redis.createClient.apply(redis.createClient, args);
                        var responses = [];

                        monitorClient.monitor(function (err, res) {
                            client.mget("some", "keys", "foo", "bar");
                            client.set("json", JSON.stringify({
                                foo: "123",
                                bar: "sdflkdfsjk",
                                another: false
                            }));
                        });

                        monitorClient.on("monitor", function (time, args) {
                            responses.push(args);
                            if (responses.length === 2) {
                                assert.strictEqual(5, responses[0].length);
                                assert.strictEqual("mget", responses[0][0]);
                                assert.strictEqual("some", responses[0][1]);
                                assert.strictEqual("keys", responses[0][2]);
                                assert.strictEqual("foo", responses[0][3]);
                                assert.strictEqual("bar", responses[0][4]);
                                assert.strictEqual(3, responses[1].length);
                                assert.strictEqual("set", responses[1][0]);
                                assert.strictEqual("json", responses[1][1]);
                                assert.strictEqual('{"foo":"123","bar":"sdflkdfsjk","another":false}', responses[1][2]);
                                monitorClient.quit(done);
                            }
                        });
                    });
                });

                describe('idle', function () {
                    it('emits idle as soon as there are no outstanding commands', function (done) {
                        client.on('idle', function onIdle () {
                            client.removeListener("idle", onIdle);
                            client.get('foo', helper.isString('bar', done));
                        });
                        client.set('foo', 'bar');
                    });
                });

                describe('utf8', function () {
                    it('handles utf-8 keys', function (done) {
                      var utf8_sample = "ಠ_ಠ";
                      client.set(["utf8test", utf8_sample], helper.isString("OK"));
                      client.get(["utf8test"], function (err, obj) {
                          assert.strictEqual(utf8_sample, obj);
                          return done(err);
                      });
                    });
                });
            });

            describe('unref', function () {
                it('exits subprocess as soon as final command is processed', function (done) {
                    this.timeout(12000);
                    var args = config.HOST[ip] ? [config.HOST[ip], config.PORT] : [ip];
                    var external = fork("./test/lib/unref.js", args);

                    var id = setTimeout(function () {
                        external.kill();
                        return done(Error('unref subprocess timed out'));
                    }, 8000);

                    external.on("close", function (code) {
                        clearTimeout(id);
                        assert.strictEqual(code, 0);
                        return done();
                    });
                });
            });

            describe('socket_nodelay', function () {
                describe('true', function () {
                    var args = config.configureClient(parser, ip, {
                        socket_nodelay: true
                    });

                    it("fires client.on('ready')", function (done) {
                        client = redis.createClient.apply(redis.createClient, args);
                        client.on("ready", function () {
                            assert.strictEqual(true, client.options.socket_nodelay);
                            client.quit();

                            client.once('end', function () {
                                return done();
                            });
                        });
                    });

                    it('client is functional', function (done) {
                        client = redis.createClient.apply(redis.createClient, args);
                        client.on("ready", function () {
                            assert.strictEqual(true, client.options.socket_nodelay);
                            client.set(["set key 1", "set val"], helper.isString("OK"));
                            client.set(["set key 2", "set val"], helper.isString("OK"));
                            client.get(["set key 1"], helper.isString("set val"));
                            client.get(["set key 2"], helper.isString("set val"));
                            client.quit();

                            client.once('end', function () {
                                return done();
                            });
                        });
                    });
                });

                describe('false', function () {
                    var args = config.configureClient(parser, ip, {
                        socket_nodelay: false
                    });

                    it("fires client.on('ready')", function (done) {
                        client = redis.createClient.apply(redis.createClient, args);
                        client.on("ready", function () {
                            assert.strictEqual(false, client.options.socket_nodelay);
                            client.quit();

                            client.once('end', function () {
                                return done();
                            });
                        });
                    });

                    it('client is functional', function (done) {
                        client = redis.createClient.apply(redis.createClient, args);
                        client.on("ready", function () {
                            assert.strictEqual(false, client.options.socket_nodelay);
                            client.set(["set key 1", "set val"], helper.isString("OK"));
                            client.set(["set key 2", "set val"], helper.isString("OK"));
                            client.get(["set key 1"], helper.isString("set val"));
                            client.get(["set key 2"], helper.isString("set val"));
                            client.quit();

                            client.once('end', function () {
                                return done();
                            });
                        });
                    });
                });

                describe('defaults to true', function () {

                    it("fires client.on('ready')", function (done) {
                        client = redis.createClient.apply(redis.createClient, args);
                        client.on("ready", function () {
                            assert.strictEqual(true, client.options.socket_nodelay);
                            client.quit();

                            client.once('end', function () {
                                return done();
                            });
                        });
                    });

                    it('client is functional', function (done) {
                        client = redis.createClient.apply(redis.createClient, args);
                        client.on("ready", function () {
                            assert.strictEqual(true, client.options.socket_nodelay);
                            client.set(["set key 1", "set val"], helper.isString("OK"));
                            client.set(["set key 2", "set val"], helper.isString("OK"));
                            client.get(["set key 1"], helper.isString("set val"));
                            client.get(["set key 2"], helper.isString("set val"));
                            client.quit();

                            client.once('end', function () {
                                return done();
                            });
                        });
                    });
                });
            });

            describe('retry_max_delay', function () {
                var args = config.configureClient(parser, ip, {
                    retry_max_delay: 1 // ms
                });

                it("sets upper bound on how long client waits before reconnecting", function (done) {
                    var time = new Date().getTime();
                    var reconnecting = false;

                    client = redis.createClient.apply(redis.createClient, args);
                    client.on('ready', function() {
                        if (!reconnecting) {
                            reconnecting = true;
                            client.retry_delay = 1000;
                            client.retry_backoff = 1;
                            client.stream.end();
                        } else {
                            client.end();
                            var lasted = new Date().getTime() - time;
                            assert.ok(lasted < 100);
                            return done();
                        }
                    });
                });
            });

            describe('enable_offline_queue', function () {
                describe('true', function () {
                    it("should emit drain if offline queue is flushed and nothing to buffer", function (done) {
                        client = redis.createClient({
                            parser: parser,
                            no_ready_check: true
                        });
                        var end = helper.callFuncAfter(done, 2);
                        client.set('foo', 'bar');
                        client.get('foo', end);
                        client.on('drain', function() {
                            assert(client.offline_queue.length === 0);
                            end();
                        });
                    });

                    it("does not return an error and enqueues operation", function (done) {
                        client = redis.createClient(9999, null, {
                            max_attempts: 0,
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

                    it("enqueues operation and keep the queue while trying to reconnect", function (done) {
                        client = redis.createClient(9999, null, {
                            max_attempts: 4,
                            parser: parser
                        });
                        var i = 0;

                        client.on('error', function(err) {
                            if (err.message === 'Redis connection in broken state: maximum connection attempts exceeded.') {
                                assert(i, 3);
                                assert.strictEqual(client.offline_queue.length, 0);
                                done();
                            } else {
                                assert.equal(err.code, 'ECONNREFUSED');
                                assert.equal(err.errno, 'ECONNREFUSED');
                                assert.equal(err.syscall, 'connect');
                            }
                        });

                        client.on('reconnecting', function(params) {
                            i++;
                            assert.equal(params.attempt, i);
                            assert.strictEqual(client.offline_queue.length, 2);
                        });

                        // Should work with either a callback or without
                        client.set('baz', 13);
                        client.set('foo', 'bar', function(err, result) {
                            assert(i, 3);
                            assert(err);
                            assert.strictEqual(client.offline_queue.length, 0);
                        });
                    });

                    it("flushes the command queue if connection is lost", function (done) {
                        client = redis.createClient({
                            parser: parser
                        });

                        client.once('ready', function() {
                            var multi = client.multi();
                            multi.config("bar");
                            var cb = function(err, reply) {
                                assert.equal(err.code, 'UNCERTAIN_STATE');
                            };
                            for (var i = 0; i < 12; i += 3) {
                                client.set("foo" + i, "bar" + i);
                                multi.set("foo" + (i + 1), "bar" + (i + 1), cb);
                                multi.set("foo" + (i + 2), "bar" + (i + 2));
                            }
                            multi.exec();
                            assert.equal(client.command_queue.length, 15);
                            helper.killConnection(client);
                        });

                        client.on("reconnecting", function (params) {
                            assert.equal(client.command_queue.length, 15);
                        });

                        client.on('error', function(err) {
                            if (/uncertain state/.test(err.message)) {
                                assert.equal(client.command_queue.length, 0);
                                done();
                            } else {
                                assert.equal(err.code, 'ECONNREFUSED');
                                assert.equal(err.errno, 'ECONNREFUSED');
                                assert.equal(err.syscall, 'connect');
                            }
                        });
                    });
                });

                describe('false', function () {

                    it('stream not writable', function(done) {
                        client = redis.createClient({
                            parser: parser,
                            enable_offline_queue: false
                        });
                        client.on('ready', function () {
                            client.stream.writable = false;
                            client.set('foo', 'bar', function (err, res) {
                                assert.strictEqual(err.message, "SET can't be processed. Stream not writeable.");
                                done();
                            });
                        });
                    });

                    it("emit an error and does not enqueues operation", function (done) {
                        client = redis.createClient(9999, null, {
                            parser: parser,
                            max_attempts: 0,
                            enable_offline_queue: false
                        });
                        var end = helper.callFuncAfter(done, 3);

                        client.on('error', function(err) {
                            assert(/offline queue is deactivated|ECONNREFUSED/.test(err.message));
                            assert.equal(client.command_queue.length, 0);
                            end();
                        });

                        client.set('foo', 'bar');

                        assert.doesNotThrow(function () {
                            client.set('foo', 'bar', function (err) {
                                // should callback with an error
                                assert.ok(err);
                                setTimeout(end, 50);
                            });
                        });
                    });

                    it("flushes the command queue if connection is lost", function (done) {
                        client = redis.createClient({
                            parser: parser,
                            max_attempts: 2,
                            enable_offline_queue: false
                        });

                        client.once('ready', function() {
                            var multi = client.multi();
                            multi.config("bar");
                            var cb = function(err, reply) {
                                assert.equal(err.code, 'UNCERTAIN_STATE');
                            };
                            for (var i = 0; i < 12; i += 3) {
                                client.set("foo" + i, "bar" + i);
                                multi.set("foo" + (i + 1), "bar" + (i + 1), cb);
                                multi.set("foo" + (i + 2), "bar" + (i + 2));
                            }
                            multi.exec();
                            assert.equal(client.command_queue.length, 15);
                            helper.killConnection(client);
                        });

                        client.on("reconnecting", function (params) {
                            assert.equal(client.command_queue.length, 15);
                        });

                        client.on('error', function(err) {
                            if (err.code === 'UNCERTAIN_STATE') {
                                assert.equal(client.command_queue.length, 0);
                                done();
                            } else {
                                assert.equal(err.code, 'ECONNREFUSED');
                                assert.equal(err.errno, 'ECONNREFUSED');
                                assert.equal(err.syscall, 'connect');
                            }
                        });
                    });
                });
            });

        });
    });
});
