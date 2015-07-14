var async = require('async');
var assert = require('assert');
var config = require("../lib/config");
var nodeAssert = require('../lib/nodeify-assertions');
var redis = config.redis;
var RedisProcess = require("../lib/redis-process");
var uuid = require('uuid');

describe("The 'incr' method", function () {

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
            var key = "sequence";

            describe("when not connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("error", done);
                    client.once("connect", function () {
                        client.set(key, "9007199254740992", function (err, res) {
                            nodeAssert.isNotError()(err, res);
                            client.quit();
                        });
                    });
                    client.on('end', function () {
                        return done();
                    });
                });

                it("reports an error", function (done) {
                    client.incr(function (err, res) {
                        assert.equal(err.message, 'Redis connection gone from end event.');
                        done();
                    });
                });
            });

            describe("when connected and a value in Redis", function () {
                var client;

                // Also, why tf were these disabled for hiredis? They work just fine.
                before(function (done) {
                    /*
                        9007199254740992 -> 9007199254740992
                        9007199254740993 -> 9007199254740992
                        9007199254740994 -> 9007199254740994
                        9007199254740995 -> 9007199254740996
                        9007199254740996 -> 9007199254740996
                        9007199254740997 -> 9007199254740996
                    */
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("error", done);
                    client.once("connect", function () {
                        client.set(key, "9007199254740992", function (err, res) {
                            nodeAssert.isNotError()(err, res);
                            done();
                        });
                    });
                });

                after(function () {
                    client.end();
                });

                it("changes the last digit from 2 to 3", function (done) {
                    client.incr(key, function (err, res) {
                        nodeAssert.isString("9007199254740993")(err, res);
                        done(err);
                    });
                });

                describe("and we call it again", function () {
                    it("changes the last digit from 3 to 4", function (done) {
                        client.incr(key, function (err, res) {
                            nodeAssert.isString("9007199254740994")(err, res);
                            done(err);
                        });
                    });

                    describe("and again", function () {
                        it("changes the last digit from 4 to 5", function (done) {
                            client.incr(key, function (err, res) {
                                nodeAssert.isString("9007199254740995")(err, res);
                                done(err);
                            });
                        });

                        describe("and again", function () {
                            it("changes the last digit from 5 to 6", function (done) {
                                client.incr(key, function (err, res) {
                                    nodeAssert.isString("9007199254740996")(err, res);
                                    done(err);
                                });
                            });

                            describe("and again", function () {
                                it("changes the last digit from 6 to 7", function (done) {
                                    client.incr(key, function (err, res) {
                                        nodeAssert.isString("9007199254740997")(err, res);
                                        done(err);
                                    });
                                });
                            });
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
