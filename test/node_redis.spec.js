var async = require("async");
var assert = require("assert");
var config = require("./lib/config");
var helper = require('./helper')
var fork = require("child_process").fork;
var redis = config.redis;

describe("The node_redis client", function () {

    helper.allTests(function(parser, ip, args) {

        if (args[2]) { // skip if options are undefined
            describe("testing parser existence", function () {
                it('throws on non-existence', function (done) {
                    var mochaListener = helper.removeMochaListener();

                    process.once('uncaughtException', function (err) {
                        process.on('uncaughtException', mochaListener);
                        assert.equal(err.message, 'Couldn\'t find named parser nonExistingParser on this system');
                        return done();
                    });

                    // Don't pollute the args for the other connections
                    var tmp = JSON.parse(JSON.stringify(args));
                    tmp[2].parser = 'nonExistingParser';
                    redis.createClient.apply(redis.createClient, tmp);
                });
            });
        }

        describe("using " + parser + " and " + ip, function () {
            var client;

            describe("when not connected", function () {
                afterEach(function () {
                    if (client) {
                        client.end();
                    }
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

                it("throws on strange connection info", function () {
                    try {
                        redis.createClient(true);
                        throw new Error('failed');
                    } catch (err) {
                        assert.equal(err.message, 'unknown type of connection in createClient()');
                    }
                });

                if (ip === 'IPv4') {
                    it('allows connecting with the redis url and the default port', function (done) {
                        client = redis.createClient('redis://foo:porkchopsandwiches@' + config.HOST[ip]);
                        client.on("ready", function () {
                            return done();
                        });
                    });

                    it('allows connecting with the redis url and no auth', function (done) {
                        client = redis.createClient('redis://' + config.HOST[ip] + ':' + config.PORT, {
                            detect_buffers: false
                        });
                        client.on("ready", function () {
                            return done();
                        });
                    });
                }

            });

            describe("when connected", function () {
                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("error", done);
                    client.once("connect", function () {
                        client.flushdb(done)
                    });
                });

                afterEach(function () {
                    client.end();
                });

                describe("when redis closes unexpectedly", function () {
                    it("reconnects and can retrieve the pre-existing data", function (done) {
                        client.on("reconnecting", function on_recon(params) {
                            client.on("connect", function on_connect() {
                                async.parallel([function (cb) {
                                    client.get("recon 1", function (err, res) {
                                        helper.isString("one")(err, res);
                                        cb();
                                    });
                                }, function (cb) {
                                    client.get("recon 1", function (err, res) {
                                        helper.isString("one")(err, res);
                                        cb();
                                    });
                                }, function (cb) {
                                    client.get("recon 2", function (err, res) {
                                        helper.isString("two")(err, res);
                                        cb();
                                    });
                                }, function (cb) {
                                    client.get("recon 2", function (err, res) {
                                        helper.isString("two")(err, res);
                                        cb();
                                    });
                                }], function (err, results) {
                                    client.removeListener("connect", on_connect);
                                    client.removeListener("reconnecting", on_recon);
                                    done(err);
                                });
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
                            client.on("reconnecting", function on_recon(params) {
                                client.on("ready", function on_connect() {
                                    client.unsubscribe(helper.isNotError());

                                    client.on('unsubscribe', function (channel, count) {
                                        // we should now be out of subscriber mode.
                                        client.set('foo', 'bar', helper.isNumber(1));
                                        return done();
                                    });
                                });
                            });

                            client.set("recon 1", "one");
                            client.subscribe("recon channel", function (err, res) {
                                // Do not do this in normal programs. This is to simulate the server closing on us.
                                // For orderly shutdown in normal programs, do client.quit()
                                client.stream.destroy();
                            });
                        });

                        it("remains subscribed", function () {
                            var client2 = redis.createClient.apply(redis.createClient, args);

                            client.on("reconnecting", function on_recon(params) {
                                client.on("ready", function on_connect() {
                                    async.parallel([function (cb) {
                                        client.on("message", function (channel, message) {
                                            try {
                                                helper.isString("recon channel")(null, channel);
                                                helper.isString("a test message")(null, message);
                                            } catch (err) {
                                                cb(err);
                                            }
                                        });

                                        client2.subscribe("recon channel", function (err, res) {
                                            if (err) {
                                                cb(err);
                                                return;
                                            }
                                            client2.publish("recon channel", "a test message");
                                        });
                                    }], function (err, results) {
                                        done(err);
                                    });
                                });
                            });

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
                                console.log("Skipping " + name + " because this version of node doesn't have domains.");
                                return done();
                            }

                            if (domain) {
                                domain.run(function () {
                                    client.set('domain', 'value', function (err, res) {
                                        assert.ok(process.domain);
                                        var notFound = res.not.existing.thing; // ohhh nooooo
                                    });
                                });

                                // this is the expected and desired behavior
                                domain.on('error', function (err) {
                                  domain.exit();
                                  return done()
                                });
                            }
                        });
                    });

                    describe('monitor', function () {
                        it('monitors commands on all other redis clients', function (done) {
                            if (!helper.serverVersionAtLeast(client, [2, 6, 0])) return done();

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

                });

                it('emits errors thrown from within an on("message") handler', function (done) {
                    var client2 = redis.createClient.apply(redis.createClient, args);
                    var name = 'channel';

                    client2.subscribe(name, function () {
                        client.publish(name, "some message");
                    });

                    client2.on("message", function (channel, data) {
                        if (channel == name) {
                            assert.equal(data, "some message");
                            throw Error('forced exception');
                        }
                        return done();
                    });

                    client2.once("error", function (err) {
                        client2.end();
                        assert.equal(err.message, 'forced exception');
                        return done();
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

            describe('detect_buffers', function () {
                var client;
                var args = config.configureClient(parser, ip, {
                    detect_buffers: true
                });

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("error", done);
                    client.once("connect", function () {
                        client.flushdb(function (err) {
                            client.hmset("hash key 2", "key 1", "val 1", "key 2", "val 2");
                            client.set("string key 1", "string value");
                            return done(err);
                        });
                    });
                });

                describe('get', function () {
                    describe('first argument is a string', function () {
                        it('returns a string', function (done) {
                            client.get("string key 1", helper.isString("string value", done));
                        });

                        it('returns a string when executed as part of transaction', function (done) {
                            client.multi().get("string key 1").exec(helper.isString("string value", done));
                        });
                    });

                    describe('first argument is a buffer', function () {
                        it('returns a buffer', function (done) {
                            client.get(new Buffer("string key 1"), function (err, reply) {
                                assert.strictEqual(true, Buffer.isBuffer(reply));
                                assert.strictEqual("<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>", reply.inspect());
                                return done(err);
                            });
                        });

                        it('returns a bufffer when executed as part of transaction', function (done) {
                            client.multi().get(new Buffer("string key 1")).exec(function (err, reply) {
                                assert.strictEqual(1, reply.length);
                                assert.strictEqual(true, Buffer.isBuffer(reply[0]));
                                assert.strictEqual("<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>", reply[0].inspect());
                                return done(err);
                            });
                        });
                    });
                });

                describe('multi.hget', function () {
                    it('can interleave string and buffer results', function (done) {
                        client.multi()
                            .hget("hash key 2", "key 1")
                            .hget(new Buffer("hash key 2"), "key 1")
                            .hget("hash key 2", new Buffer("key 2"))
                            .hget("hash key 2", "key 2")
                            .exec(function (err, reply) {
                                assert.strictEqual(true, Array.isArray(reply));
                                assert.strictEqual(4, reply.length);
                                assert.strictEqual("val 1", reply[0]);
                                assert.strictEqual(true, Buffer.isBuffer(reply[1]));
                                assert.strictEqual("<Buffer 76 61 6c 20 31>", reply[1].inspect());
                                assert.strictEqual(true, Buffer.isBuffer(reply[2]));
                                assert.strictEqual("<Buffer 76 61 6c 20 32>", reply[2].inspect());
                                assert.strictEqual("val 2", reply[3]);
                                return done(err);
                            });
                    });
                });

                describe('hmget', function () {
                    describe('first argument is a string', function () {
                        it('returns strings for keys requested', function (done) {
                            client.hmget("hash key 2", "key 1", "key 2", function (err, reply) {
                                assert.strictEqual(true, Array.isArray(reply));
                                assert.strictEqual(2, reply.length);
                                assert.strictEqual("val 1", reply[0]);
                                assert.strictEqual("val 2", reply[1]);
                                return done(err);
                            });
                        });

                        it('returns strings for keys requested in transaction', function (done) {
                            client.multi().hmget("hash key 2", "key 1", "key 2").exec(function (err, reply) {
                                assert.strictEqual(true, Array.isArray(reply));
                                assert.strictEqual(1, reply.length);
                                assert.strictEqual(2, reply[0].length);
                                assert.strictEqual("val 1", reply[0][0]);
                                assert.strictEqual("val 2", reply[0][1]);
                                return done(err);
                            });
                        });

                        it('handles array of strings with undefined values (repro #344)', function (done) {
                            client.hmget("hash key 2", "key 3", "key 4", function(err, reply) {
                                assert.strictEqual(true, Array.isArray(reply));
                                assert.strictEqual(2, reply.length);
                                assert.equal(null, reply[0]);
                                assert.equal(null, reply[1]);
                                return done(err);
                            });
                        });

                        it('handles array of strings with undefined values in transaction (repro #344)', function (done) {
                            client.multi().hmget("hash key 2", "key 3", "key 4").exec(function(err, reply) {
                                assert.strictEqual(true, Array.isArray(reply));
                                assert.strictEqual(1, reply.length);
                                assert.strictEqual(2, reply[0].length);
                                assert.equal(null, reply[0][0]);
                                assert.equal(null, reply[0][1]);
                                return done(err);
                            });
                        });
                    });

                    describe('first argument is a buffer', function () {
                        it('returns buffers for keys requested', function (done) {
                            client.hmget(new Buffer("hash key 2"), "key 1", "key 2", function (err, reply) {
                                assert.strictEqual(true, Array.isArray(reply));
                                assert.strictEqual(2, reply.length);
                                assert.strictEqual(true, Buffer.isBuffer(reply[0]));
                                assert.strictEqual(true, Buffer.isBuffer(reply[1]));
                                assert.strictEqual("<Buffer 76 61 6c 20 31>", reply[0].inspect());
                                assert.strictEqual("<Buffer 76 61 6c 20 32>", reply[1].inspect());
                                return done(err);
                            });
                        });

                        it("returns buffers for keys requested in transaction", function (done) {
                            client.multi().hmget(new Buffer("hash key 2"), "key 1", "key 2").exec(function (err, reply) {
                                assert.strictEqual(true, Array.isArray(reply));
                                assert.strictEqual(1, reply.length);
                                assert.strictEqual(2, reply[0].length);
                                assert.strictEqual(true, Buffer.isBuffer(reply[0][0]));
                                assert.strictEqual(true, Buffer.isBuffer(reply[0][1]));
                                assert.strictEqual("<Buffer 76 61 6c 20 31>", reply[0][0].inspect());
                                assert.strictEqual("<Buffer 76 61 6c 20 32>", reply[0][1].inspect());
                                return done(err);
                            });
                        });
                    });
                });

                describe('hgetall', function (done) {
                    describe('first argument is a string', function () {
                        it('returns string values', function (done) {
                            client.hgetall("hash key 2", function (err, reply) {
                                assert.strictEqual("object", typeof reply);
                                assert.strictEqual(2, Object.keys(reply).length);
                                assert.strictEqual("val 1", reply["key 1"]);
                                assert.strictEqual("val 2", reply["key 2"]);
                                return done(err);
                            });
                        });

                        it('returns string values when executed in transaction', function (done) {
                            client.multi().hgetall("hash key 2").exec(function (err, reply) {
                                assert.strictEqual(1, reply.length);
                                assert.strictEqual("object", typeof reply[0]);
                                assert.strictEqual(2, Object.keys(reply[0]).length);
                                assert.strictEqual("val 1", reply[0]["key 1"]);
                                assert.strictEqual("val 2", reply[0]["key 2"]);
                                return done(err);
                            });
                        });
                    });

                    describe('first argument is a buffer', function () {
                        it('returns buffer values', function (done) {
                            client.hgetall(new Buffer("hash key 2"), function (err, reply) {
                                assert.strictEqual(null, err);
                                assert.strictEqual("object", typeof reply);
                                assert.strictEqual(2, Object.keys(reply).length);
                                assert.strictEqual(true, Buffer.isBuffer(reply["key 1"]));
                                assert.strictEqual(true, Buffer.isBuffer(reply["key 2"]));
                                assert.strictEqual("<Buffer 76 61 6c 20 31>", reply["key 1"].inspect());
                                assert.strictEqual("<Buffer 76 61 6c 20 32>", reply["key 2"].inspect());
                                return done(err);
                            });
                        });

                        it('returns buffer values when executed in transaction', function (done) {
                            client.multi().hgetall(new Buffer("hash key 2")).exec(function (err, reply) {
                                assert.strictEqual(1, reply.length);
                                assert.strictEqual("object", typeof reply);
                                assert.strictEqual(2, Object.keys(reply[0]).length);
                                assert.strictEqual(true, Buffer.isBuffer(reply[0]["key 1"]));
                                assert.strictEqual(true, Buffer.isBuffer(reply[0]["key 2"]));
                                assert.strictEqual("<Buffer 76 61 6c 20 31>", reply[0]["key 1"].inspect());
                                assert.strictEqual("<Buffer 76 61 6c 20 32>", reply[0]["key 2"].inspect());
                                return done(err);
                            });
                        });
                    });
                });
            });

            describe('unref', function () {
                it('exits subprocess as soon as final command is processed', function (done) {
                    var args = config.HOST[ip] ? [config.HOST[ip], config.PORT] : [ip];
                    var external = fork("./test/lib/unref.js", args);
                    var id = setTimeout(function () {
                        external.kill();
                        return done(Error('unref subprocess timed out'));
                    }, 5000);

                    external.on("close", function (code) {
                        clearTimeout(id);
                        assert.strictEqual(code, 0);
                        return done();
                    });
                });
            });

            describe('socket_nodelay', function () {
                describe('true', function () {
                    var client;
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
                    var client;
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
                    var client;
                    var args = config.configureClient(parser, ip);

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
                var client;
                var args = config.configureClient(parser, ip, {
                    retry_max_delay: 1
                });

                it("sets upper bound on how long client waits before reconnecting", function (done) {
                    var time = new Date().getTime()
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
                            assert.ok(lasted < 1000);
                            return done();
                        }
                    });
                });
            });

            describe('enable_offline_queue', function () {
                describe('true', function () {
                    it("does not throw an error and enqueues operation", function (done) {
                        var client = redis.createClient(9999, null, {
                            max_attempts: 1,
                            parser: parser
                        });

                        client.on('error', function(e) {
                            // ignore, b/c expecting a "can't connect" error
                        });

                        return setTimeout(function() {
                            client.set('foo', 'bar', function(err, result) {
                                if (err) return done(err);
                            });

                            return setTimeout(function(){
                                assert.strictEqual(client.offline_queue.length, 1);
                                return done();
                            }, 25);
                        }, 50);
                    });
                });

                describe('false', function () {
                    it("does not throw an error and enqueues operation", function (done) {
                        var client = redis.createClient(9999, null, {
                            parser: parser,
                            max_attempts: 1,
                            enable_offline_queue: false
                        });

                        client.on('error', function() {
                            // ignore, b/c expecting a "can't connect" error
                        });

                        assert.throws(function () {
                            cli.set('foo', 'bar');
                        });

                        assert.doesNotThrow(function () {
                            client.set('foo', 'bar', function (err) {
                                // should callback with an error
                                assert.ok(err);
                                setTimeout(function () {
                                    return done();
                                }, 50);
                            });
                        });
                    });
                });
            });

        });
    });
});
