'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'blpop' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;
            var bclient;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('pops value immediately if list contains values', function (done) {
                bclient = redis.createClient.apply(redis.createClient, args);
                redis.debug_mode = true;
                client.rpush("blocking list", "initial value", helper.isNumber(1));
                redis.debug_mode = false;
                bclient.blpop("blocking list", 0, function (err, value) {
                    assert.strictEqual(value[0], "blocking list");
                    assert.strictEqual(value[1], "initial value");
                    return done(err);
                });
            });

            it('pops value immediately if list contains values using array notation', function (done) {
                bclient = redis.createClient.apply(redis.createClient, args);
                client.rpush(["blocking list", "initial value"], helper.isNumber(1));
                bclient.blpop(["blocking list", 0], function (err, value) {
                    assert.strictEqual(value[0], "blocking list");
                    assert.strictEqual(value[1], "initial value");
                    return done(err);
                });
            });

            it('waits for value if list is not yet populated', function (done) {
                bclient = redis.createClient.apply(redis.createClient, args);
                bclient.blpop("blocking list 2", 5, function (err, value) {
                    assert.strictEqual(value[0], "blocking list 2");
                    assert.strictEqual(value[1], "initial value");
                    return done(err);
                });
                client.rpush("blocking list 2", "initial value", helper.isNumber(1));
            });

            it('times out after specified time', function (done) {
                bclient = redis.createClient.apply(redis.createClient, args);
                bclient.BLPOP("blocking list", 1, function (err, res) {
                    assert.strictEqual(res, null);
                    return done(err);
                });
            });

            afterEach(function () {
                client.end();
                bclient.end();
            });
        });
    });
});
