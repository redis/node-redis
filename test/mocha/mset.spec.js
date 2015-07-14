var async = require('async');
var assert = require('assert');
var config = require("../lib/config");
var nodeAssert = require('../lib/nodeify-assertions');
var redis = config.redis;
var RedisProcess = require("../lib/redis-process");
var uuid = require('uuid');

describe("The 'mset' method", function () {

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
            var key, value, key2, value2;

            beforeEach(function () {
                key = uuid.v4();
                value = uuid.v4();
                key2 = uuid.v4();
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
                    client.mset(key, value, key2, value2, function (err, res) {
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

                describe("and a callback is specified", function () {
                    describe("with valid parameters", function () {
                        it("sets the value correctly", function (done) {
                            client.mset(key, value, key2, value2, function (err, res) {
                                nodeAssert.isNotError()(err, res);
                                async.parallel([function (next) {
                                    client.get(key, function (err, res) {
                                        nodeAssert.isString(value)(err, res);
                                        next();
                                    });
                                }, function (next) {
                                    client.get(key2, function (err, res) {
                                        nodeAssert.isString(value2)(err, res);
                                        next();
                                    });
                                }], function (err) {
                                    done(err);
                                });
                            });
                        });
                    });

                    describe("with undefined 'key' parameter and missing 'value' parameter", function () {
                        it("reports an error", function (done) {
                            client.mset(undefined, function (err, res) {
                                nodeAssert.isError()(err, null);
                                done();
                            });
                        });
                    });

                    describe("with undefined 'key' and defined 'value' parameters", function () {
                        it("reports an error", function () {
                            client.mset(undefined, value, undefined, value2, function (err, res) {
                                nodeAssert.isError()(err, null);
                                done();
                            });
                        });
                    });
                });

                describe("and no callback is specified", function () {
                    describe("with valid parameters", function () {
                        it("sets the value correctly", function (done) {
                            client.mset(key, value, key2, value2);

                            setTimeout(function () {
                                async.parallel([function (next) {
                                    client.get(key, function (err, res) {
                                        nodeAssert.isString(value)(err, res);
                                        next();
                                    });
                                }, function (next) {
                                    client.get(key2, function (err, res) {
                                        nodeAssert.isString(value2)(err, res);
                                        next();
                                    });
                                }], function (err) {
                                    done(err);
                                });
                            }, 100);
                        });
                    });

                    describe("with undefined 'key' and missing 'value'  parameter", function () {
                        // this behavior is different from the 'set' behavior.
                        it("throws an error", function (done) {
                            var mochaListener = removeMochaListener();

                            process.once('uncaughtException', function (err) {
                                process.on('uncaughtException', mochaListener);
                                nodeAssert.isError()(err, null);
                                return done();
                            });

                            client.mset();
                        });
                    });

                    describe("with undefined 'key' and defined 'value' parameters", function () {
                        it("throws an error", function () {
                            var mochaListener = removeMochaListener();

                            process.once('uncaughtException', function (err) {
                                process.on('uncaughtException', mochaListener);
                                nodeAssert.isError()(err, null);
                            });

                            client.mset(undefined, value, undefined, value2);
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
