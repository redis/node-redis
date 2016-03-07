'use strict';

var assert = require("assert");
var config = require("./lib/config");
var helper = require('./helper');
var fork = require("child_process").fork;
var redis = config.redis;

describe("The node_redis client", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            afterEach(function () {
                client.end(true);
            });

            describe("when connected", function () {
                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("connect", function () {
                        client.flushdb(done);
                    });
                });

                describe('duplicate', function () {
                    it('check if all options got copied properly', function(done) {
                        client.selected_db = 2;
                        var client2 = client.duplicate();
                        assert.strictEqual(client2.selected_db, 2);
                        assert(client.connected);
                        assert(!client2.connected);
                        for (var elem in client.options) {
                            if (client.options.hasOwnProperty(elem)) {
                                assert.strictEqual(client2.options[elem], client.options[elem]);
                            }
                        }
                        client2.on('ready', function () {
                            client2.end(true);
                            done();
                        });
                    });

                    it('check if all new options replaced the old ones', function(done) {
                        var client2 = client.duplicate({
                            no_ready_check: true
                        });
                        assert(client.connected);
                        assert(!client2.connected);
                        assert.strictEqual(client.options.no_ready_check, undefined);
                        assert.strictEqual(client2.options.no_ready_check, true);
                        assert.notDeepEqual(client.options, client2.options);
                        for (var elem in client.options) {
                            if (client.options.hasOwnProperty(elem)) {
                                if (elem !== 'no_ready_check') {
                                    assert.strictEqual(client2.options[elem], client.options[elem]);
                                }
                            }
                        }
                        client2.on('ready', function () {
                            client2.end(true);
                            done();
                        });
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

                    it('safe strings that are bigger than 30000 characters with multi', function(done) {
                        var str = 'foo ಠ_ಠ bar ';
                        while (str.length < 111111) {
                            str += str;
                        }
                        var called = false;
                        var temp = client.writeBuffers.bind(client);
                        assert(String(client.writeBuffers) !== String(client.writeDefault));
                        client.writeBuffers = function (data) {
                            called = true;
                            // To increase write performance for strings the value is converted to a buffer
                            assert(String(client.writeBuffers) === String(client.writeDefault));
                            temp(data);
                        };
                        client.multi().set('foo', str).get('foo', function (err, res) {
                            assert.strictEqual(res, str);
                        }).exec(function (err, res) {
                            assert(called);
                            assert.strictEqual(res[1], str);
                            done();
                        });
                        assert(String(client.writeBuffers) !== String(client.writeDefault));
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
                            assert.equal(err.command, undefined);
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

                describe("retry_unfulfilled_commands", function () {

                    it("should retry all commands instead of returning an error if a command did not yet return after a connection loss", function (done) {
                        var bclient = redis.createClient({
                            parser: parser,
                            retry_unfulfilled_commands: true
                        });
                        bclient.blpop("blocking list 2", 5, function (err, value) {
                            assert.strictEqual(value[0], "blocking list 2");
                            assert.strictEqual(value[1], "initial value");
                            return done(err);
                        });
                        bclient.once('ready', function () {
                            setTimeout(function () {
                                bclient.stream.destroy();
                                client.rpush("blocking list 2", "initial value", helper.isNumber(1));
                            }, 100);
                        });
                    });

                });

                describe(".end", function () {

                    it('used without flush / flush set to false', function(done) {
                        var finished = false;
                        var end = helper.callFuncAfter(function() {
                            if (!finished) {
                                done(new Error('failed'));
                            }
                        }, 20);
                        var cb = function(err, res) {
                            assert(/The connection has already been closed/.test(err.message));
                            end();
                        };
                        for (var i = 0; i < 20; i++) {
                            if (i === 10) {
                                client.end();
                            }
                            client.set('foo', 'bar', cb);
                        }
                        setTimeout(function () {
                            finished = true;
                            done();
                        }, 250);
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

                        // TODO: Investigate why this test is failing hard and killing mocha.
                        // Seems like something is wrong with nyc while passing a socket connection to create client!
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
                            var domain = require('domain').create();

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
                        var end = helper.callFuncAfter(done, 2);
                        client.on('warning', function (msg) {
                            assert.strictEqual(
                                msg,
                                'The idle event listener is deprecated and will likely be removed in v.3.0.0.\n' +
                                'If you rely on this feature please open a new ticket in node_redis with your use case'
                            );
                            end();
                        });
                        client.on('idle', function onIdle () {
                            client.removeListener("idle", onIdle);
                            client.get('foo', helper.isString('bar', end));
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

            describe('execution order / fire query while loading', function () {
                it('keep execution order for commands that may fire while redis is still loading', function (done) {
                    client = redis.createClient.apply(null, args);
                    var fired = false;
                    client.set('foo', 'bar', function (err, res) {
                        assert(fired === false);
                        done();
                    });
                    client.info(function (err, res) {
                        fired = true;
                    });
                });

                it('should fire early', function (done) {
                    client = redis.createClient.apply(null, args);
                    var fired = false;
                    client.info(function (err, res) {
                        fired = true;
                    });
                    client.set('foo', 'bar', function (err, res) {
                        assert(fired);
                        done();
                    });
                    assert.strictEqual(client.offline_queue.length, 1);
                    assert.strictEqual(client.command_queue.length, 1);
                    client.on('connect', function () {
                        assert.strictEqual(client.offline_queue.length, 1);
                        assert.strictEqual(client.command_queue.length, 1);
                    });
                    client.on('ready', function () {
                        assert.strictEqual(client.offline_queue.length, 0);
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
                            client.end(true);
                            var lasted = new Date().getTime() - time;
                            assert.ok(lasted < 100);
                            return done();
                        }
                    });
                    client.on('error', function (err) {
                        // This is rare but it might be triggered.
                        // So let's have a robust test
                        assert.strictEqual(err.code, 'ECONNRESET');
                    });
                });
            });

            describe('protocol error', function () {

                it("should gracefully recover and only fail on the already send commands", function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.on('error', function(err) {
                        assert.strictEqual(err.message, 'Protocol error, got "a" as reply type byte');
                        // After the hard failure work properly again. The set should have been processed properly too
                        client.get('foo', function (err, res) {
                            assert.strictEqual(res, 'bar');
                            done();
                        });
                    });
                    client.once('ready', function () {
                        client.set('foo', 'bar', function (err, res) {
                            assert.strictEqual(err.message, 'Protocol error, got "a" as reply type byte');
                        });
                        // Fail the set answer. Has no corresponding command obj and will therefor land in the error handler and set
                        client.reply_parser.execute(new Buffer('a*1\r*1\r$1`zasd\r\na'));
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
                        var end = helper.callFuncAfter(done, 3);
                        client.set('foo', 'bar');
                        client.get('foo', end);
                        client.on('warning', function (msg) {
                            assert.strictEqual(
                                msg,
                                'The drain event listener is deprecated and will be removed in v.3.0.0.\n' +
                                'If you want to keep on listening to this event please listen to the stream drain event directly.'
                            );
                            end();
                        });
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
                        var finished = false;
                        client.on('error', function(e) {
                            // ignore, b/c expecting a "can't connect" error
                        });

                        return setTimeout(function() {
                            client.set('foo', 'bar', function(err, result) {
                                if (!finished) {
                                    // This should never be called
                                    return done(err);
                                } else {
                                    assert.strictEqual(err.message, "The command can't be processed. The connection has already been closed.");
                                }
                            });

                            return setTimeout(function() {
                                assert.strictEqual(client.offline_queue.length, 1);
                                finished = true;
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
                            assert.strictEqual(params.times_connected, 0);
                            assert(params.error instanceof Error);
                            assert(typeof params.total_retry_time === 'number');
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
                            client.stream.destroy();
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
