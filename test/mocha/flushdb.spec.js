var async = require('async');
var assert = require('assert');
var config = require("../lib/config");
var nodeAssert = require('../lib/nodeify-assertions');
var redis = config.redis;
var RedisProcess = require("../lib/redis-process");
var uuid = require('uuid');

describe("The 'flushdb' method", function () {

    var rp;
    before(function (done) {
        RedisProcess.start(function (err, _rp) {
            rp = _rp;
            return done(err);
        });
    })

    function removeMochaListener () {
        var mochaListener = process.listeners('uncaughtException').pop();
        process.removeListener('uncaughtException', mochaListener);
        return mochaListener;
    }

    function allTests(parser, ip) {
        var args = config.configureClient(parser, ip);

        describe("using " + parser + " and " + ip, function () {
            var key, key2;

            beforeEach(function () {
                key = uuid.v4();
                key2 = uuid.v4();
            });

            describe("when not connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("error", done);
                    client.once("connect", function () {
                        client.quit();
                    });
                    client.on('end', function () {
                        return done();
                    });
                });

                it("reports an error", function (done) {
                    client.flushdb(function (err, res) {
                        assert.equal(err.message, 'Redis connection gone from end event.');
                        done();
                    });
                });
            });

            describe("when connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("error", done);
                    client.once("connect", function () {
                        done();
                    });
                });

                afterEach(function () {
                    client.end();
                });

                describe("when there is data in Redis", function () {
                    var oldSize;

                    beforeEach(function (done) {
                        async.parallel([function (next) {
                            client.mset(key, uuid.v4(), key2, uuid.v4(), function (err, res) {
                                nodeAssert.isNotError()(err, res);
                                next(err);
                            });
                        }, function (next) {
                            client.dbsize([], function (err, res) {
                                nodeAssert.isType.positiveNumber()(err, res);
                                oldSize = res;
                                next(err);
                            });
                        }], function (err) {
                            if (err) {
                                return done(err);
                            }

                            client.flushdb(function (err, res) {
                                nodeAssert.isString("OK")(err, res);
                                done(err);
                            });
                        });
                    });

                    it("deletes all the keys", function (done) {
                        client.mget(key, key2, function (err, res) {
                            assert.strictEqual(null, err, "Unexpected error returned");
                            assert.strictEqual(true, Array.isArray(res), "Results object should be an array.");
                            assert.strictEqual(2, res.length, "Results array should have length 2.");
                            assert.strictEqual(null, res[0], "Redis key should have been flushed.");
                            assert.strictEqual(null, res[1], "Redis key should have been flushed.");
                            done(err);
                        });
                    });

                    it("results in a db size of zero", function (done) {
                        client.dbsize([], function (err, res) {
                            nodeAssert.isNotError()(err, res);
                            nodeAssert.isType.number()(err, res);
                            assert.strictEqual(0, res, "Flushing db should result in db size 0");
                            done();
                        });
                    });
                });
            });
        });
    }

    ['javascript', 'hiredis'].forEach(function (parser) {
        allTests(parser, "/tmp/redis.sock");
        ['IPv4', 'IPv6'].forEach(function (ip) {
            allTests(parser, ip);
        })
    });

    after(function (done) {
        if (rp) rp.stop(done);
    });
});
