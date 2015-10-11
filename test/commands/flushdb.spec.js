'use strict';

var assert = require('assert');
var config = require("../lib/config");
var helper = require('../helper');
var redis = config.redis;
var uuid = require('uuid');

describe("The 'flushdb' method", function () {

    helper.allTests(function(parser, ip, args) {

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
                    client.once("ready", function () {
                        client.quit();
                    });
                    client.on('end', function () {
                        return done();
                    });
                });

                it("reports an error", function (done) {
                    client.flushdb(function (err, res) {
                        assert(err.message.match(/The connection has already been closed/));
                        done();
                    });
                });
            });

            describe("when connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("ready", function () {
                        done();
                    });
                });

                afterEach(function () {
                    client.end();
                });

                describe("when there is data in Redis", function () {

                    beforeEach(function (done) {
                        client.mset(key, uuid.v4(), key2, uuid.v4(), helper.isNotError());
                        client.dbsize([], function (err, res) {
                            helper.isType.positiveNumber()(err, res);
                            assert.equal(res, 2, 'Two keys should have been inserted');
                            done();
                        });
                    });

                    it("deletes all the keys", function (done) {
                        client.flushdb(function(err, res) {
                            assert.equal(res, 'OK');
                            client.mget(key, key2, function (err, res) {
                                assert.strictEqual(null, err, "Unexpected error returned");
                                assert.strictEqual(true, Array.isArray(res), "Results object should be an array.");
                                assert.strictEqual(2, res.length, "Results array should have length 2.");
                                assert.strictEqual(null, res[0], "Redis key should have been flushed.");
                                assert.strictEqual(null, res[1], "Redis key should have been flushed.");
                                done(err);
                            });
                        });
                    });

                    it("results in a db size of zero", function (done) {
                        client.flushdb(function(err, res) {
                            client.dbsize([], function (err, res) {
                                helper.isNotError()(err, res);
                                helper.isType.number()(err, res);
                                assert.strictEqual(0, res, "Flushing db should result in db size 0");
                                done();
                            });
                        });
                    });

                    it("results in a db size of zero without a callback", function (done) {
                        client.flushdb();
                        setTimeout(function(err, res) {
                            client.dbsize([], function (err, res) {
                                helper.isNotError()(err, res);
                                helper.isType.number()(err, res);
                                assert.strictEqual(0, res, "Flushing db should result in db size 0");
                                done();
                            });
                        }, 25);
                    });
                });
            });
        });
    });
});
