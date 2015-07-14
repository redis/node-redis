var async = require('async');
var assert = require('assert');
var config = require("../lib/config");
var nodeAssert = require('../lib/nodeify-assertions');
var redis = config.redis;
var RedisProcess = require("../lib/redis-process");

describe("The 'select' method", function () {

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

                it("throws an error if redis is not connected", function (done) {
                    client.select(1, function (err, res) {
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
                    client.once("connect", function () { done(); });
                });

                afterEach(function () {
                    client.end();
                });

                it("changes the database and calls the callback", function (done) {
                    // default value of null means database 0 will be used.
                    assert.strictEqual(client.selected_db, null, "default db should be null");
                    client.select(1, function (err, res) {
                        nodeAssert.isNotError()(err, res);
                        assert.strictEqual(client.selected_db, 1, "db should be 1 after select");
                        done();
                    });
                });

                describe("and a callback is specified", function () {
                    describe("with a valid db index", function () {
                        it("selects the appropriate database", function (done) {
                            assert.strictEqual(client.selected_db, null, "default db should be null");
                            client.select(1, function () {
                                assert.equal(client.selected_db, 1, "we should have selected the new valid DB");
                                return done();
                            });
                        });
                    });

                    describe("with an invalid db index", function () {
                        it("emits an error", function (done) {
                            assert.strictEqual(client.selected_db, null, "default db should be null");
                            client.select(9999, function (err) {
                                assert.equal(err.message, 'ERR invalid DB index')
                                return done();
                            });
                        });
                    });
                });

                describe("and no callback is specified", function () {
                    describe("with a valid db index", function () {
                        it("selects the appropriate database", function (done) {
                            assert.strictEqual(client.selected_db, null, "default db should be null");
                            client.select(1);
                            setTimeout(function () {
                                assert.equal(client.selected_db, 1, "we should have selected the new valid DB");
                                return done();
                            }, 100);
                        });
                    });

                    describe("with an invalid db index", function () {
                        it("throws an error when callback not provided", function (done) {
                            var mochaListener = removeMochaListener();
                            assert.strictEqual(client.selected_db, null, "default db should be null");

                            process.once('uncaughtException', function (err) {
                                process.on('uncaughtException', mochaListener);
                                assert.equal(err.message, 'ERR invalid DB index');
                                return done();
                            });

                            client.select(9999);
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
