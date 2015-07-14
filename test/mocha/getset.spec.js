var async = require('async');
var assert = require('assert');
var config = require("../lib/config");
var nodeAssert = require('../lib/nodeify-assertions');
var redis = config.redis;
var RedisProcess = require("../lib/redis-process");
var uuid = require('uuid');

describe("The 'getset' method", function () {

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
            var key, value, value2;

            beforeEach(function () {
                key = uuid.v4();
                value = uuid.v4();
                value2 = uuid.v4();
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
                    client.get(key, function (err, res) {
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

                describe("when the key exists in Redis", function () {
                    beforeEach(function (done) {
                        client.set(key, value, function (err, res) {
                            nodeAssert.isNotError()(err, res);
                            done();
                        });
                    });

                    it("gets the value correctly", function (done) {
                        client.getset(key, value2, function (err, res) {
                            nodeAssert.isString(value)(err, res);
                            client.get(key, function (err, res) {
                                nodeAssert.isString(value2)(err, res);
                                done(err);
                            });
                        });
                    });
                });

                describe("when the key does not exist in Redis", function () {
                    it("gets a null value", function (done) {
                        client.getset(key, value, function (err, res) {
                            nodeAssert.isNull()(err, res);
                            done(err);
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
