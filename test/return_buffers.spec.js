'use strict';

var assert = require("assert");
var config = require("./lib/config");
var helper = require('./helper');
var redis = config.redis;

describe("return_buffers", function () {

    helper.allTests(function(parser, ip, basicArgs) {

        describe("using " + parser + " and " + ip, function () {
            var client;
            var args = config.configureClient(parser, ip, {
                return_buffers: true,
                detect_buffers: true
            });

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                if (args[2].detect_buffers) {
                    // Test if detect_buffer option was deactivated
                    assert.strictEqual(client.options.detect_buffers, false);
                    args[2].detect_buffers = false;
                }
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
                    it('returns a buffer', function (done) {
                        client.get("string key 1", function (err, reply) {
                            assert.strictEqual(true, Buffer.isBuffer(reply));
                            assert.strictEqual("<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>", reply.inspect());
                            return done(err);
                        });
                    });

                    it('returns a bufffer when executed as part of transaction', function (done) {
                        client.multi().get("string key 1").exec(function (err, reply) {
                            assert.strictEqual(1, reply.length);
                            assert.strictEqual(true, Buffer.isBuffer(reply[0]));
                            assert.strictEqual("<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>", reply[0].inspect());
                            return done(err);
                        });
                    });
                });
            });

            describe('multi.hget', function () {
                it('returns buffers', function (done) {
                    client.multi()
                        .hget("hash key 2", "key 1")
                        .hget(new Buffer("hash key 2"), "key 1")
                        .hget("hash key 2", new Buffer("key 2"))
                        .hget("hash key 2", "key 2")
                        .exec(function (err, reply) {
                            assert.strictEqual(true, Array.isArray(reply));
                            assert.strictEqual(4, reply.length);
                            assert.strictEqual("<Buffer 76 61 6c 20 31>", reply[0].inspect());
                            assert.strictEqual(true, Buffer.isBuffer(reply[1]));
                            assert.strictEqual("<Buffer 76 61 6c 20 31>", reply[1].inspect());
                            assert.strictEqual(true, Buffer.isBuffer(reply[2]));
                            assert.strictEqual("<Buffer 76 61 6c 20 32>", reply[2].inspect());
                            assert.strictEqual(true, Buffer.isBuffer(reply[3]));
                            assert.strictEqual("<Buffer 76 61 6c 20 32>", reply[3].inspect());
                            return done(err);
                        });
                });
            });

            describe('batch.hget', function () {
                it('returns buffers', function (done) {
                    client.batch()
                        .hget("hash key 2", "key 1")
                        .hget(new Buffer("hash key 2"), "key 1")
                        .hget("hash key 2", new Buffer("key 2"))
                        .hget("hash key 2", "key 2")
                        .exec(function (err, reply) {
                            assert.strictEqual(true, Array.isArray(reply));
                            assert.strictEqual(4, reply.length);
                            assert.strictEqual("<Buffer 76 61 6c 20 31>", reply[0].inspect());
                            assert.strictEqual(true, Buffer.isBuffer(reply[1]));
                            assert.strictEqual("<Buffer 76 61 6c 20 31>", reply[1].inspect());
                            assert.strictEqual(true, Buffer.isBuffer(reply[2]));
                            assert.strictEqual("<Buffer 76 61 6c 20 32>", reply[2].inspect());
                            assert.strictEqual(true, Buffer.isBuffer(reply[3]));
                            assert.strictEqual("<Buffer 76 61 6c 20 32>", reply[3].inspect());
                            return done(err);
                        });
                });
            });

            describe('hmget', function () {
                describe('first argument is a string', function () {
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

                    it("returns buffers for keys requested in .batch", function (done) {
                        client.batch().hmget(new Buffer("hash key 2"), "key 1", "key 2").exec(function (err, reply) {
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
                    it('returns buffer values', function (done) {
                        client.hgetall("hash key 2", function (err, reply) {
                            assert.strictEqual("object", typeof reply);
                            assert.strictEqual(2, Object.keys(reply).length);
                            assert.strictEqual("<Buffer 76 61 6c 20 31>", reply["key 1"].inspect());
                            assert.strictEqual("<Buffer 76 61 6c 20 32>", reply["key 2"].inspect());
                            return done(err);
                        });
                    });

                    it('returns buffer values when executed in transaction', function (done) {
                        client.multi().hgetall("hash key 2").exec(function (err, reply) {
                            assert.strictEqual(1, reply.length);
                            assert.strictEqual("object", typeof reply[0]);
                            assert.strictEqual(2, Object.keys(reply[0]).length);
                            assert.strictEqual("<Buffer 76 61 6c 20 31>", reply[0]["key 1"].inspect());
                            assert.strictEqual("<Buffer 76 61 6c 20 32>", reply[0]["key 2"].inspect());
                            return done(err);
                        });
                    });

                    it('returns buffer values when executed in .batch', function (done) {
                        client.batch().hgetall("hash key 2").exec(function (err, reply) {
                            assert.strictEqual(1, reply.length);
                            assert.strictEqual("object", typeof reply[0]);
                            assert.strictEqual(2, Object.keys(reply[0]).length);
                            assert.strictEqual("<Buffer 76 61 6c 20 31>", reply[0]["key 1"].inspect());
                            assert.strictEqual("<Buffer 76 61 6c 20 32>", reply[0]["key 2"].inspect());
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
                            assert.strictEqual("object", typeof reply[0]);
                            assert.strictEqual(2, Object.keys(reply[0]).length);
                            assert.strictEqual(true, Buffer.isBuffer(reply[0]["key 1"]));
                            assert.strictEqual(true, Buffer.isBuffer(reply[0]["key 2"]));
                            assert.strictEqual("<Buffer 76 61 6c 20 31>", reply[0]["key 1"].inspect());
                            assert.strictEqual("<Buffer 76 61 6c 20 32>", reply[0]["key 2"].inspect());
                            return done(err);
                        });
                    });

                    it('returns buffer values when executed in .batch', function (done) {
                        client.batch().hgetall(new Buffer("hash key 2")).exec(function (err, reply) {
                            assert.strictEqual(1, reply.length);
                            assert.strictEqual("object", typeof reply[0]);
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

            describe('publish/subscribe', function (done) {
                var pub;
                var sub;
                var channel = "test channel";
                var message = new Buffer("test message");

                var args = config.configureClient(parser, ip, {
                    return_buffers: true
                });

                beforeEach(function (done) {
                    var pubConnected;
                    var subConnected;

                    pub = redis.createClient.apply(redis.createClient, basicArgs);
                    sub = redis.createClient.apply(redis.createClient, args);
                    pub.once("connect", function () {
                        pub.flushdb(function () {
                            pubConnected = true;
                            if (subConnected) {
                                done();
                            }
                        });
                    });
                    sub.once("connect", function () {
                        subConnected = true;
                        if (pubConnected) {
                            done();
                        }
                    });
                });

                it('receives buffer messages', function (done) {
                    sub.on("subscribe", function (chnl, count) {
                        pub.publish(channel, message);
                    });

                    sub.on("message", function (chnl, msg) {
                        assert.strictEqual(true, Buffer.isBuffer(msg));
                        assert.strictEqual("<Buffer 74 65 73 74 20 6d 65 73 73 61 67 65>", msg.inspect());
                        return done();
                    });

                    sub.subscribe(channel);
                });

                afterEach(function () {
                    sub.end();
                    pub.end();
                });
            });
        });
    });
});
