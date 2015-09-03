var async = require('async');
var assert = require('assert');
var config = require("../lib/config");
var helper = require('../helper');
var redis = config.redis;

describe("The 'select' method", function () {

    helper.allTests(function(parser, ip, args) {

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
                        helper.isNotError()(err, res);
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
                            var mochaListener = helper.removeMochaListener();
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
    });
});
