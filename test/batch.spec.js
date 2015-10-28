'use strict';

var assert = require('assert');
var config = require("./lib/config");
var helper = require('./helper');
var redis = config.redis;
var uuid = require('uuid');

describe("The 'batch' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var key, value;

            beforeEach(function () {
                key = uuid.v4();
                value = uuid.v4();
            });

            describe("when not connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("connect", function () {
                        client.quit();
                    });
                    client.on('end', function () {
                        return done();
                    });
                });

                it("returns an empty array", function (done) {
                    var batch = client.batch();
                    batch.exec(function (err, res) {
                        assert.strictEqual(err, null);
                        assert.strictEqual(res.length, 0);
                        done();
                    });
                });

                it("returns an empty array if promisified", function () {
                    return client.batch().execAsync().then(function(res) {
                        assert.strictEqual(res.length, 0);
                    });
                });
            });

            describe("when connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("ready", function () {
                        client.flushdb(function (err) {
                            return done(err);
                        });
                    });
                });

                afterEach(function () {
                    client.end();
                });

                it("returns an empty array", function (done) {
                    var batch = client.batch();
                    batch.exec(function (err, res) {
                        assert.strictEqual(err, null);
                        assert.strictEqual(res.length, 0);
                        done();
                    });
                });

                it("runs normal calls inbetween batch", function (done) {
                    var batch = client.batch();
                    batch.set("m1", "123");
                    client.set('m2', '456', done);
                });

                it("returns an empty array if promisified", function () {
                    return client.batch().execAsync().then(function(res) {
                        assert.strictEqual(res.length, 0);
                    });
                });

                it("returns an empty result array", function (done) {
                    var batch = client.batch();
                    var async = true;
                    var notBuffering = batch.exec(function (err, res) {
                        assert.strictEqual(err, null);
                        assert.strictEqual(res.length, 0);
                        async = false;
                        done();
                    });
                    assert(async);
                    assert.strictEqual(notBuffering, true);
                });

                it('fail individually when one command fails using chaining notation', function (done) {
                    var batch1, batch2;
                    batch1 = client.batch();
                    batch1.mset("batchfoo", "10", "batchbar", "20", helper.isString("OK"));

                    // Provoke an error at queue time
                    batch1.set("foo2", helper.isError());
                    batch1.incr("batchfoo");
                    batch1.incr("batchbar");
                    batch1.exec(function () {
                        // Confirm that the previous command, while containing an error, still worked.
                        batch2 = client.batch();
                        batch2.get('foo2', helper.isNull());
                        batch2.incr("batchbar", helper.isNumber(22));
                        batch2.incr("batchfoo", helper.isNumber(12));
                        batch2.exec(function (err, replies) {
                            assert.strictEqual(null, replies[0]);
                            assert.strictEqual(22, replies[1]);
                            assert.strictEqual(12, replies[2]);
                            return done();
                        });
                    });
                });

                it('fail individually when one command fails and emit the error if no callback has been provided', function (done) {
                    var batch1;
                    client.on('error', function (err) {
                        done(err);
                    });
                    batch1 = client.batch();
                    batch1.mset("batchfoo", "10", "batchbar", "20", helper.isString("OK"));

                    // Provoke an error at queue time
                    batch1.set("foo2");
                    batch1.incr("batchfoo");
                    batch1.incr("batchbar");
                    batch1.exec(function (err, res) {
                        assert.strictEqual(res[1].command, 'SET');
                        assert.strictEqual(res[1].code, 'ERR');
                        done();
                    });
                });

                it('fail individually when one command in an array of commands fails', function (done) {
                    // test nested batch-bulk replies
                    client.batch([
                        ["mget", "batchfoo", "batchbar", function (err, res) {
                            assert.strictEqual(2, res.length);
                            assert.strictEqual(0, +res[0]);
                            assert.strictEqual(0, +res[1]);
                        }],
                        ["set", "foo2", helper.isError()],
                        ["incr", "batchfoo"],
                        ["incr", "batchbar"]
                    ]).exec(function (err, replies) {
                        assert.strictEqual(2, replies[0].length);
                        assert.strictEqual(null, replies[0][0]);
                        assert.strictEqual(null, replies[0][1]);
                        assert.strictEqual('SET', replies[1].command);
                        assert.strictEqual("1", replies[2].toString());
                        assert.strictEqual("1", replies[3].toString());
                        return done();
                    });
                });

                it('handles multiple operations being applied to a set', function (done) {
                    client.sadd("some set", "mem 1");
                    client.sadd(["some set", "mem 2"]);
                    client.sadd("some set", "mem 3");
                    client.sadd("some set", "mem 4");

                    // make sure empty mb reply works
                    client.del("some missing set");
                    client.smembers("some missing set", function (err, reply) {
                        // make sure empty mb reply works
                        assert.strictEqual(0, reply.length);
                    });

                    // test nested batch-bulk replies with empty mb elements.
                    client.BATCH([
                        ["smembers", ["some set"]],
                        ["del", "some set"],
                        ["smembers", "some set"]
                    ])
                    .scard("some set")
                    .exec(function (err, replies) {
                        assert.strictEqual(4, replies[0].length);
                        assert.strictEqual(0, replies[2].length);
                        return done();
                    });
                });

                it('allows multiple operations to be performed using constructor with all kinds of syntax', function (done) {
                    var now = Date.now();
                    var arr = ["batchhmset", "batchbar", "batchbaz"];
                    var arr2 = ['some manner of key', 'otherTypes'];
                    var arr3 = [5768, "batchbarx", "batchfoox"];
                    var arr4 = ["mset", [578, "batchbar"], helper.isString('OK')];
                    client.batch([
                        arr4,
                        [["mset", "batchfoo2", "batchbar2", "batchfoo3", "batchbar3"], helper.isString('OK')],
                        ["hmset", arr],
                        [["hmset", "batchhmset2", "batchbar2", "batchfoo3", "batchbar3", "test", helper.isString('OK')]],
                        ["hmset", ["batchhmset", "batchbar", "batchfoo", helper.isString('OK')]],
                        ["hmset", arr3, helper.isString('OK')],
                        ['hmset', now, {123456789: "abcdefghij", "some manner of key": "a type of value", "otherTypes": 555}],
                        ['hmset', 'key2', {"0123456789": "abcdefghij", "some manner of key": "a type of value", "otherTypes": 999}, helper.isString('OK')],
                        ["HMSET", "batchhmset", ["batchbar", "batchbaz"]],
                        ["hmset", "batchhmset", ["batchbar", "batchbaz"], helper.isString('OK')],
                    ])
                    .hmget(now, 123456789, 'otherTypes')
                    .hmget('key2', arr2, function noop() {})
                    .hmget(['batchhmset2', 'some manner of key', 'batchbar3'])
                    .mget('batchfoo2', ['batchfoo3', 'batchfoo'], function(err, res) {
                        assert(res[0], 'batchfoo3');
                        assert(res[1], 'batchfoo');
                    })
                    .exec(function (err, replies) {
                        assert.equal(arr.length, 3);
                        assert.equal(arr2.length, 2);
                        assert.equal(arr3.length, 3);
                        assert.equal(arr4.length, 3);
                        assert.strictEqual(null, err);
                        assert.equal(replies[10][1], '555');
                        assert.equal(replies[11][0], 'a type of value');
                        assert.strictEqual(replies[12][0], null);
                        assert.equal(replies[12][1], 'test');
                        assert.equal(replies[13][0], 'batchbar2');
                        assert.equal(replies[13].length, 3);
                        assert.equal(replies.length, 14);
                        return done();
                    });
                });

                it('converts a non string key to a string', function(done) {
                    // TODO: Converting the key might change soon again.
                    client.batch().hmset(true, {
                        test: 123,
                        bar: 'baz'
                    }).exec(done);
                });

                it('runs a batch without any further commands', function(done) {
                    var buffering = client.batch().exec(function(err, res) {
                        assert.strictEqual(err, null);
                        assert.strictEqual(res.length, 0);
                        done();
                    });
                    assert(typeof buffering === 'boolean');
                });

                it('runs a batch without any further commands and without callback', function() {
                    var buffering = client.batch().exec();
                    assert.strictEqual(buffering, true);
                });

                it('allows multiple operations to be performed using a chaining API', function (done) {
                    client.batch()
                        .mset('some', '10', 'keys', '20')
                        .incr('some')
                        .incr('keys')
                        .mget('some', 'keys')
                        .exec(function (err, replies) {
                            assert.strictEqual(null, err);
                            assert.equal('OK', replies[0]);
                            assert.equal(11, replies[1]);
                            assert.equal(21, replies[2]);
                            assert.equal(11, replies[3][0].toString());
                            assert.equal(21, replies[3][1].toString());
                            return done();
                        });
                });

                it('allows multiple commands to work the same as normal to be performed using a chaining API', function (done) {
                    client.batch()
                        .mset(['some', '10', 'keys', '20'])
                        .incr(['some', helper.isNumber(11)])
                        .incr(['keys'], helper.isNumber(21))
                        .mget('some', 'keys')
                        .exec(function (err, replies) {
                            assert.strictEqual(null, err);
                            assert.equal('OK', replies[0]);
                            assert.equal(11, replies[1]);
                            assert.equal(21, replies[2]);
                            assert.equal(11, replies[3][0].toString());
                            assert.equal(21, replies[3][1].toString());
                            return done();
                        });
                });

                it('allows multiple commands to work the same as normal to be performed using a chaining API promisified', function () {
                    return client.batch()
                        .mset(['some', '10', 'keys', '20'])
                        .incr(['some', helper.isNumber(11)])
                        .incr(['keys'], helper.isNumber(21))
                        .mget('some', 'keys')
                        .execAsync()
                        .then(function (replies) {
                            assert.equal('OK', replies[0]);
                            assert.equal(11, replies[1]);
                            assert.equal(21, replies[2]);
                            assert.equal(11, replies[3][0].toString());
                            assert.equal(21, replies[3][1].toString());
                        });
                });

                it('allows an array to be provided indicating multiple operations to perform', function (done) {
                    // test nested batch-bulk replies with nulls.
                    client.batch([
                        ["mget", ["batchfoo", "some", "random value", "keys"]],
                        ["incr", "batchfoo"]
                    ])
                    .exec(function (err, replies) {
                        assert.strictEqual(replies.length, 2);
                        assert.strictEqual(replies[0].length, 4);
                        return done();
                    });
                });

                it('allows multiple operations to be performed on a hash', function (done) {
                    client.batch()
                        .hmset("batchhash", "a", "foo", "b", 1)
                        .hmset("batchhash", {
                            extra: "fancy",
                            things: "here"
                        })
                        .hgetall("batchhash")
                        .exec(done);
                });

                it("should work without any callback", function (done) {
                    helper.serverVersionAtLeast.call(this, client, [2, 6, 5]);

                    var batch = client.batch();
                    batch.set("baz", "binary");
                    batch.set("foo", "bar");
                    batch.exec();

                    client.get('foo', helper.isString('bar', done));
                });

            });
        });
    });
});
